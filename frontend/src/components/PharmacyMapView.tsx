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

type GeocoderAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};
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
        const city =
          components.find(c => c.types.includes('locality'))?.long_name ??
          components.find(c => c.types.includes('administrative_area_level_3'))?.long_name ??
          components.find(c => c.types.includes('postal_town'))?.long_name;
        resolve(city);
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
  onLoadInArea?: (center: LatLng, city?: string) => void;
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
  onVisibleChange,
  userLocation,
  searchCity,
  className,
}: MapContentProps) => {
  const isLoaded = useApiIsLoaded();
  const [center, setCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);
  const onVisibleChangeRef = useRef(onVisibleChange);
  useEffect(() => { onVisibleChangeRef.current = onVisibleChange; });

  useEffect(() => {
    setDisplayed(pharmacies);
  }, [pharmacies]);

  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
      setMapCenter(userLocation);
    }
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
          const next = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          };
          setCenter(next);
          setMapCenter(next);
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

  // Filter to pharmacies visible within current map bounds
  const visibleDisplayed = useMemo(() => {
    if (!mapBounds) return displayed;
    return displayed.filter(p =>
      !p.latitude || !p.longitude || (
        p.latitude >= mapBounds.south &&
        p.latitude <= mapBounds.north &&
        p.longitude >= mapBounds.west &&
        p.longitude <= mapBounds.east
      ),
    );
  }, [displayed, mapBounds]);

  useEffect(() => {
    onVisibleChangeRef.current?.(visibleDisplayed);
  }, [visibleDisplayed]);

  const handleCameraChanged = (ev: {
    detail: {
      center: { lat: number; lng: number };
      bounds?: MapBounds;
    };
  }) => {
    setMapCenter({ lat: ev.detail.center.lat, lng: ev.detail.center.lng });
    if (ev.detail.bounds) setMapBounds(ev.detail.bounds);
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
        onCameraChanged={handleCameraChanged}
      >
        {displayed.map(p =>
          p.latitude && p.longitude ? (
            <Marker
              key={p.id}
              position={{ lat: p.latitude, lng: p.longitude }}
              title={p.name}
              onClick={() => onSelect?.(p.id)}
            />
          ) : null,
        )}
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
            const city = isLoaded ? await reverseGeocodeCity(mapCenter.lat, mapCenter.lng) : undefined;
            onLoadInArea(mapCenter, city);
          }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 bg-white shadow-lg px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200"
        >
          <Search size={14} />
          Szukaj aptek w tym obszarze
        </button>
      )}
    </div>
  );
};

export interface PharmacyMapViewProps {
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (center: LatLng, city?: string) => void;
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
        onVisibleChange={onVisibleChange}
        userLocation={userLocation}
        searchCity={searchCity}
        className={className}
      />
    </APIProvider>
  );
};

export default PharmacyMapView;
