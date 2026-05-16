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

type LatLng    = { lat: number; lng: number };
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

const DEFAULT_CENTER: LatLng = { lat: 52.237, lng: 21.017 };
const DEFAULT_ZOOM             = 13;
const GEOCODE_BATCH_LIMIT      = 25;

const SELECTED_PIN = {
  background:  '#43A047',
  borderColor: '#1B5E20',
  glyphColor:  '#1B5E20',
} as const;

const isGeocoded = (p: Pharmacy): p is Pharmacy & { latitude: number; longitude: number } =>
  typeof p.latitude === 'number' && typeof p.longitude === 'number';

const inBounds = (lat: number, lng: number, b: MapBounds) =>
  lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;

const MapPanner = ({ center }: { center: LatLng }) => {
  const map = useMap();
  useEffect(() => { map?.panTo(center); }, [map, center]);
  return null;
};

interface MapContentProps {
  pharmacies:       Pharmacy[];
  selectedId?:      string | null;
  onSelect?:        (id: string) => void;
  onLoadInArea?:    (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?:    LatLng | null;
  searchCity?:      string;
  className:        string;
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
  const [center,    setCenter]    = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);

  const onVisibleChangeRef = useRef(onVisibleChange);
  useEffect(() => { onVisibleChangeRef.current = onVisibleChange; });

  useEffect(() => { setDisplayed(pharmacies); }, [pharmacies]);

  useEffect(() => { if (userLocation) setCenter(userLocation); }, [userLocation]);

  useEffect(() => {
    const selected = displayed.find(p => p.id === selectedId);
    if (selected && isGeocoded(selected)) {
      setCenter({ lat: selected.latitude, lng: selected.longitude });
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
    const missing = pharmacies.filter(p => !isGeocoded(p)).slice(0, GEOCODE_BATCH_LIMIT);
    if (!missing.length) return;

    const geocoder = new window.google.maps.Geocoder();
    missing.forEach(pharmacy => {
      geocoder.geocode(
        { address: `${pharmacy.address}, ${pharmacy.city}, Poland` },
        (results, status) => {
          if (status !== 'OK' || !results?.[0]) return;
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          setDisplayed(prev => prev.map(p =>
            p.id === pharmacy.id ? { ...p, latitude: lat, longitude: lng } : p,
          ));
          updatePharmacyLocation(pharmacy.name, pharmacy.address, pharmacy.city, lat, lng);
        },
      );
    });
  }, [isLoaded, pharmacies]);

  const visibleDisplayed = useMemo(() => {
    const geocoded = displayed.filter(isGeocoded);
    return mapBounds
      ? geocoded.filter(p => inBounds(p.latitude, p.longitude, mapBounds))
      : geocoded;
  }, [displayed, mapBounds]);

  useEffect(() => {
    onVisibleChangeRef.current?.(visibleDisplayed);
  }, [visibleDisplayed]);

  const handleCameraChanged = useCallback((ev: { detail: { bounds?: MapBounds } }) => {
    if (ev.detail.bounds) setMapBounds(ev.detail.bounds);
  }, []);

  const handleSearchArea = useCallback(() => {
    if (mapBounds) onLoadInArea?.(mapBounds);
  }, [mapBounds, onLoadInArea]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={DEFAULT_ZOOM}
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
            {p.id === selectedId ? <Pin {...SELECTED_PIN} scale={1.2} /> : <Pin />}
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
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 bg-white shadow-lg px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-200 whitespace-nowrap"
        >
          <Search size={14} className="shrink-0" />
          <span className="sm:hidden">Szukaj tutaj</span>
          <span className="hidden sm:inline">Szukaj aptek w tym obszarze</span>
        </button>
      )}
    </div>
  );
};

export interface PharmacyMapViewProps {
  pharmacies?:      Pharmacy[];
  selectedId?:      string | null;
  onSelect?:        (id: string) => void;
  onLoadInArea?:    (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?:    LatLng | null;
  searchCity?:      string;
  className?:       string;
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
