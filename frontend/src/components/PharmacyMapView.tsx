import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  useMap,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import MapPlaceholder from './MapPlaceholder';
import { updatePharmacyLocation } from '../services/pharmacyService';
import type { Pharmacy } from '../types/pharmacy';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_CENTER: LatLng = { lat: 52.237, lng: 21.017 };

// Resolves a lat/lng to a city name. Checks sublocality first because Google
// sometimes classifies border towns (e.g. Ząbki) as sublocality rather than locality.
const reverseGeocodeCity = (lat: number, lng: number): Promise<string | undefined> =>
  new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) { resolve(undefined); return; }
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results) { resolve(undefined); return; }
      const c = results.flatMap(r => r.address_components ?? []);
      resolve(
        c.find(x => x.types.includes('locality'))?.long_name ??
        c.find(x => x.types.includes('sublocality_level_1'))?.long_name ??
        c.find(x => x.types.includes('sublocality'))?.long_name ??
        c.find(x => x.types.includes('administrative_area_level_3'))?.long_name,
      );
    });
  });

// ─── MapPanner ────────────────────────────────────────────────────────────────

// Pans the map whenever `center` changes without re-mounting the Map component.
const MapPanner = ({ center }: { center: LatLng }) => {
  const map = useMap();
  useEffect(() => { if (map) map.panTo(center); }, [map, center]);
  return null;
};

// ─── Marker colours ───────────────────────────────────────────────────────────

const SELECTED_PIN = { background: '#4CAF50', borderColor: '#2E7D32', glyphColor: '#ffffff' };

// ─── MapContent (inner component, lives inside APIProvider) ───────────────────

interface MapContentProps {
  pharmacies: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds, cities: string[]) => void;
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
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Local copy of pharmacies — augmented with coordinates resolved by the client-side
  // geocoder for entries that lack them in the DB.
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);

  // Stable ref so useEffect callbacks never capture stale onVisibleChange.
  const onVisibleChangeRef = useRef(onVisibleChange);
  useEffect(() => { onVisibleChangeRef.current = onVisibleChange; });

  // Sync displayed when parent replaces the pharmacies array (new search).
  useEffect(() => { setDisplayed(pharmacies); }, [pharmacies]);

  // Pan to user location when it becomes available.
  useEffect(() => { if (userLocation) setCenter(userLocation); }, [userLocation]);

  // Pan to a selected pharmacy.
  useEffect(() => {
    const sel = displayed.find(p => p.id === selectedId);
    if (sel?.latitude && sel?.longitude) setCenter({ lat: sel.latitude, lng: sel.longitude });
  }, [selectedId, displayed]);

  // Pan to city when search bar is used.
  useEffect(() => {
    if (!isLoaded || !searchCity) return;
    new window.google.maps.Geocoder().geocode(
      { address: `${searchCity}, Poland` },
      (results, status) => {
        if (status === 'OK' && results?.[0])
          setCenter({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
      },
    );
  }, [isLoaded, searchCity]);

  // Client-side geocoding for pharmacies that have no coordinates in the DB.
  // Processes up to 25 at a time to stay within API rate limits.
  // Once resolved, saves coordinates back to the backend so future queries return them.
  useEffect(() => {
    if (!isLoaded) return;
    const missing = pharmacies.filter(p => !p.latitude || !p.longitude).slice(0, 25);
    if (!missing.length) return;
    const geocoder = new window.google.maps.Geocoder();
    missing.forEach(pharmacy => {
      geocoder.geocode(
        { address: `${pharmacy.address}, ${pharmacy.city}, Poland` },
        (results, status) => {
          if (status !== 'OK' || !results?.[0]) return;
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setDisplayed(prev => prev.map(p => p.id === pharmacy.id ? { ...p, latitude: lat, longitude: lng } : p));
          updatePharmacyLocation(pharmacy.name, pharmacy.address, pharmacy.city, lat, lng);
        },
      );
    });
  }, [isLoaded, pharmacies]);

  // Only geocoded pharmacies that fall inside the current viewport are shown.
  const visibleDisplayed = useMemo(() => {
    const geocoded = displayed.filter(
      (p): p is Pharmacy & { latitude: number; longitude: number } =>
        typeof p.latitude === 'number' && typeof p.longitude === 'number',
    );
    if (!mapBounds) return geocoded;
    return geocoded.filter(
      p => p.latitude >= mapBounds.south && p.latitude <= mapBounds.north
        && p.longitude >= mapBounds.west && p.longitude <= mapBounds.east,
    );
  }, [displayed, mapBounds]);

  useEffect(() => { onVisibleChangeRef.current?.(visibleDisplayed); }, [visibleDisplayed]);

  const handleCameraChanged = useCallback((ev: { detail: { bounds?: MapBounds } }) => {
    if (ev.detail.bounds) setMapBounds(ev.detail.bounds);
  }, []);

  // Samples 5 edge-midpoints of the viewport (better at catching border towns than
  // corners) and resolves each to a city name, then fires onLoadInArea.
  const handleSearchArea = useCallback(async () => {
    if (!mapBounds || !onLoadInArea) return;
    const midLat = (mapBounds.north + mapBounds.south) / 2;
    const midLng = (mapBounds.east + mapBounds.west) / 2;
    const points = isLoaded ? [
      { lat: midLat,          lng: midLng          }, // centre
      { lat: mapBounds.north, lng: midLng          }, // N edge
      { lat: mapBounds.south, lng: midLng          }, // S edge
      { lat: midLat,          lng: mapBounds.east  }, // E edge
      { lat: midLat,          lng: mapBounds.west  }, // W edge
    ] : [];
    const detected = await Promise.all(points.map(p => reverseGeocodeCity(p.lat, p.lng)));
    const cities = [...new Set(detected.filter((c): c is string => !!c))];
    onLoadInArea(mapBounds, cities);
  }, [mapBounds, isLoaded, onLoadInArea]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/*
        mapId="DEMO_MAP_ID" is required to enable AdvancedMarker (the modern marker API).
        For production, replace with a Cloud-Console-configured Map ID.
      */}
      <Map
        defaultCenter={center}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        onCameraChanged={handleCameraChanged}
      >
        {visibleDisplayed.map(p => (
          <AdvancedMarker
            key={p.id}
            position={{ lat: p.latitude, lng: p.longitude }}
            title={p.name}
            onClick={() => onSelect?.(p.id)}
          >
            {p.id === selectedId
              ? <Pin {...SELECTED_PIN} scale={1.2} />
              : <Pin />
            }
          </AdvancedMarker>
        ))}

        {userLocation && (
          <AdvancedMarker position={userLocation} title="Twoja lokalizacja">
            <div className="w-4 h-4 rounded-full bg-blue-600 border-[3px] border-white shadow-md" />
          </AdvancedMarker>
        )}

        <MapPanner center={center} />
      </Map>

      {onLoadInArea && (
        <button
          type="button"
          onClick={handleSearchArea}
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

// ─── Public component ─────────────────────────────────────────────────────────

export interface PharmacyMapViewProps {
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds, cities: string[]) => void;
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
    return <MapPlaceholder className={className} message="Brak klucza VITE_GOOGLE_MAPS_API_KEY" />;
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
