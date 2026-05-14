import { useState, useEffect, useRef } from 'react';
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

type GeocoderResult = { geometry: { location: { lat(): number; lng(): number } } };

declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode(
            request: { address: string },
            callback: (results: GeocoderResult[] | null, status: string) => void,
          ): void;
        };
      };
    };
  }
}

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
  onLoadInArea?: (center: LatLng) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  className: string;
}

const MapContent = ({
  pharmacies,
  selectedId,
  onSelect,
  onLoadInArea,
  userLocation,
  searchCity,
  className,
}: MapContentProps) => {
  const isLoaded = useApiIsLoaded();
  const [center, setCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);
  const [moved, setMoved] = useState(false);
  const initialCenterRef = useRef<LatLng>(userLocation ?? DEFAULT_CENTER);

  useEffect(() => {
    setDisplayed(pharmacies);
  }, [pharmacies]);

  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
      initialCenterRef.current = userLocation;
      setMoved(false);
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
          initialCenterRef.current = next;
          setMoved(false);
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

  const handleCameraChanged = (ev: { detail: { center: { lat: number; lng: number } } }) => {
    const c = { lat: ev.detail.center.lat, lng: ev.detail.center.lng };
    setMapCenter(c);
    const init = initialCenterRef.current;
    const distKm = haversineKm(init.lat, init.lng, c.lat, c.lng);
    setMoved(distKm > 0.3);
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

      {onLoadInArea && moved && (
        <button
          type="button"
          onClick={() => {
            onLoadInArea(mapCenter);
            initialCenterRef.current = mapCenter;
            setMoved(false);
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface PharmacyMapViewProps {
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (center: LatLng) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  className?: string;
}

const PharmacyMapView = ({
  pharmacies = [],
  selectedId,
  onSelect,
  onLoadInArea,
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
        userLocation={userLocation}
        searchCity={searchCity}
        className={className}
      />
    </APIProvider>
  );
};

export default PharmacyMapView;
