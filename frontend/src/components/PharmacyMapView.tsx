import { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
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

const DEFAULT_CENTER: LatLng = { lat: 52.237, lng: 21.017 }; // Warszawa

/* Rendered inside <Map> – can safely call useMap() */
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
  searchCity?: string;
  className: string;
}

const MapContent = ({
  pharmacies,
  selectedId,
  onSelect,
  searchCity,
  className,
}: MapContentProps) => {
  const isLoaded = useApiIsLoaded();
  const [center, setCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);

  /* Sync when pharmacies list changes (new search) */
  useEffect(() => {
    setDisplayed(pharmacies);
  }, [pharmacies]);

  /* Pan to selected pharmacy marker */
  useEffect(() => {
    const sel = displayed.find(p => p.id === selectedId);
    if (sel?.latitude && sel?.longitude) {
      setCenter({ lat: sel.latitude, lng: sel.longitude });
    }
  }, [selectedId, displayed]);

  /* Centre map on searched city */
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

  /* Geocode pharmacies that are missing coordinates */
  useEffect(() => {
    if (!isLoaded) return;
    const missing = pharmacies.filter(p => !p.latitude || !p.longitude).slice(0, 5);
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

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={13}
        gestureHandling="greedy"
        disableDefaultUI={false}
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
        <MapPanner center={center} />
      </Map>
    </div>
  );
};

/* ---- Public component ---- */

export interface PharmacyMapViewProps {
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  searchCity?: string;
  className?: string;
}

const PharmacyMapView = ({
  pharmacies = [],
  selectedId,
  onSelect,
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
        searchCity={searchCity}
        className={className}
      />
    </APIProvider>
  );
};

export default PharmacyMapView;
