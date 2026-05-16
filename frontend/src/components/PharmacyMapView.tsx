import { useState, useEffect, useRef, useMemo } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import MapPlaceholder from './MapPlaceholder';
import { updatePharmacyLocation } from '../services/pharmacyService';
import type { Pharmacy } from '../types/pharmacy';

type LatLng = { lat: number; lng: number };
type MapBounds = { north: number; south: number; east: number; west: number };

type GeocoderAddressComponent = { long_name: string; types: string[] };
type GeocoderResult = {
  geometry: { location: { lat(): number; lng(): number } };
  address_components?: GeocoderAddressComponent[];
};

declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode(
            request: { address: string } | { location: { lat: number; lng: number } },
            callback: (results: GeocoderResult[] | null, status: string) => void,
          ): void;
        };
      };
    };
  }
}

// Check sublocality first — it catches districts like Ząbki that Google sometimes
// classifies as sublocality rather than locality.
const reverseGeocodeCity = (lat: number, lng: number): Promise<string | undefined> =>
  new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) {
      resolve(undefined);
      return;
    }
    new window.google.maps.Geocoder().geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status !== 'OK' || !results) {
          resolve(undefined);
          return;
        }
        const components = results.flatMap(r => r.address_components ?? []);
        resolve(
          components.find(c => c.types.includes('locality'))?.long_name ??
          components.find(c => c.types.includes('sublocality_level_1'))?.long_name ??
          components.find(c => c.types.includes('sublocality'))?.long_name ??
          components.find(c => c.types.includes('administrative_area_level_3'))?.long_name,
        );
      },
    );
  });

const DEFAULT_CENTER: LatLng = { lat: 52.237, lng: 21.017 };

const MapPanner = ({ center }: { center: LatLng }) => {
  const map = useMap();
  useEffect(() => {
    if (map) map.panTo(center);
  }, [map, center]);
  return null;
};

interface MapContentProps {
  pharmacies: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds, cities: string[]) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  className: string;
}

const MapContent = ({
  pharmacies,
  selectedId,
  onSelect,
  onLoadInArea,
  onBoundsChange,
  onVisibleChange,
  userLocation,
  searchCity,
  className,
}: MapContentProps) => {
  const isLoaded = useApiIsLoaded();
  const [center, setCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);

  const onVisibleChangeRef = useRef(onVisibleChange);
  useEffect(() => { onVisibleChangeRef.current = onVisibleChange; });

  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => { onBoundsChangeRef.current = onBoundsChange; });

  // Debounced auto-fetch on viewport change (700 ms quiet period).
  // This fires automatically when the user pans or zooms so pharmacies are
  // always loaded for the visible area without requiring a manual button click.
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!mapBounds) return;
    if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
    boundsDebounceRef.current = setTimeout(() => {
      onBoundsChangeRef.current?.(mapBounds);
    }, 700);
    return () => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current);
    };
  }, [mapBounds]);

  useEffect(() => {
    setDisplayed(pharmacies);
  }, [pharmacies]);

  useEffect(() => {
    if (userLocation) setCenter(userLocation);
  }, [userLocation]);

  useEffect(() => {
    const sel = displayed.find(p => p.id === selectedId);
    if (sel?.latitude && sel?.longitude) {
      setCenter({ lat: sel.latitude, lng: sel.longitude });
    }
  }, [selectedId, displayed]);

  useEffect(() => {
    if (!isLoaded || !searchCity) return;
    new window.google.maps.Geocoder().geocode(
      { address: `${searchCity}, Poland` },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setCenter({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        }
      },
    );
  }, [isLoaded, searchCity]);

  useEffect(() => {
    if (!isLoaded) return;
    const missing = pharmacies.filter(p => !p.latitude || !p.longitude).slice(0, 25);
    if (missing.length === 0) return;

    const geocoder = new window.google.maps.Geocoder();
    missing.forEach(pharmacy => {
      geocoder.geocode(
        { address: `${pharmacy.address}, ${pharmacy.city}, Poland` },
        (results, status) => {
          if (status !== 'OK' || !results?.[0]) return;
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setDisplayed(prev =>
            prev.map(p => (p.id === pharmacy.id ? { ...p, latitude: lat, longitude: lng } : p)),
          );
          updatePharmacyLocation(pharmacy.name, pharmacy.address, pharmacy.city, lat, lng);
        },
      );
    });
  }, [isLoaded, pharmacies]);

  // Only pharmacies with coordinates confirmed inside the viewport are visible.
  const visibleDisplayed = useMemo(() => {
    const geocoded = displayed.filter(
      (p): p is Pharmacy & { latitude: number; longitude: number } =>
        typeof p.latitude === 'number' && typeof p.longitude === 'number',
    );
    if (!mapBounds) return geocoded;
    return geocoded.filter(
      p =>
        p.latitude >= mapBounds.south &&
        p.latitude <= mapBounds.north &&
        p.longitude >= mapBounds.west &&
        p.longitude <= mapBounds.east,
    );
  }, [displayed, mapBounds]);

  useEffect(() => {
    onVisibleChangeRef.current?.(visibleDisplayed);
  }, [visibleDisplayed]);

  const handleCameraChanged = (ev: { detail: { bounds?: MapBounds } }) => {
    if (ev.detail.bounds) setMapBounds(ev.detail.bounds);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onCameraChanged={handleCameraChanged}
      >
        {/* Render only in-viewport pins to avoid cluttering the map. */}
        {visibleDisplayed.map(p => (
          <Marker
            key={p.id}
            position={{ lat: p.latitude, lng: p.longitude }}
            title={p.name}
            onClick={() => onSelect?.(p.id)}
          />
        ))}
        {userLocation && (
          <Marker
            position={userLocation}
            title="Twoja lokalizacja"
            icon={{
              path: 0,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            } as unknown as string}
          />
        )}
        <MapPanner center={center} />
      </Map>

      {onLoadInArea && (
        <button
          type="button"
          onClick={async () => {
            if (!mapBounds) return;
            // Sample edge-midpoints instead of corners — midpoints hit border areas
            // more reliably when the viewport straddles two cities (e.g. Warszawa/Ząbki).
            const points = isLoaded
              ? [
                  { lat: (mapBounds.north + mapBounds.south) / 2, lng: (mapBounds.east + mapBounds.west) / 2 },
                  { lat: mapBounds.north, lng: (mapBounds.east + mapBounds.west) / 2 },
                  { lat: mapBounds.south, lng: (mapBounds.east + mapBounds.west) / 2 },
                  { lat: (mapBounds.north + mapBounds.south) / 2, lng: mapBounds.east },
                  { lat: (mapBounds.north + mapBounds.south) / 2, lng: mapBounds.west },
                ]
              : [];
            const detected = await Promise.all(points.map(p => reverseGeocodeCity(p.lat, p.lng)));
            const cities = [...new Set(detected.filter((c): c is string => !!c))];
            onLoadInArea(mapBounds, cities);
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 bg-white shadow-lg px-3 py-2 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200"
        >
          <Search size={14} />
          <span className="sm:hidden">Szukaj tutaj</span>
          <span className="hidden sm:inline">Szukaj aptek w tym obszarze</span>
        </button>
      )}
    </div>
  );
};

export interface PharmacyMapViewProps {
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds, cities: string[]) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  className?: string;
}

const PharmacyMapView = ({
  pharmacies = [],
  selectedId,
  onSelect,
  onLoadInArea,
  onBoundsChange,
  onVisibleChange,
  userLocation,
  searchCity,
  className = '',
}: PharmacyMapViewProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  if (!apiKey) {
    return (
      <MapPlaceholder
        className={className}
        message="Brak klucza VITE_GOOGLE_MAPS_API_KEY"
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapContent
        pharmacies={pharmacies}
        selectedId={selectedId}
        onSelect={onSelect}
        onLoadInArea={onLoadInArea}
        onBoundsChange={onBoundsChange}
        onVisibleChange={onVisibleChange}
        userLocation={userLocation}
        searchCity={searchCity}
        className={className}
      />
    </APIProvider>
  );
};

export default PharmacyMapView;
