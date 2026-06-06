import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { APIProvider, AdvancedMarker, Map, Pin, useMap, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { Search, Map as MapIcon } from 'lucide-react';
import { updatePharmacyLocation } from '../api';
import type { Pharmacy } from '../types';

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

const DEFAULT_CENTER: LatLng = { lat: 52.237, lng: 21.017 };
const DEFAULT_ZOOM = 13;
const GEOCODE_BATCH_LIMIT = 25;

// Domyślna pinezka — czerwona jak pinezka w logo. Zaznaczona — granatowa (kolor akcentu).
const DEFAULT_PIN = { background: '#EA4335', borderColor: '#B31412', glyphColor: '#7F0F0A' } as const;
const SELECTED_PIN = { background: '#1d4ed8', borderColor: '#1e40af', glyphColor: '#1e40af' } as const;
const FULL_AVAILABILITY_PIN = { background: '#15803D', borderColor: '#14532D', glyphColor: '#14532D' } as const;
const PARTIAL_AVAILABILITY_PIN = { background: '#EAB308', borderColor: '#854D0E', glyphColor: '#713F12' } as const;

// Zastępczy widok, gdy nie ma klucza API do Google Maps.
const MapPlaceholder = ({ className = '', message }: { className?: string; message?: string }) => (
  <div
    className={`bg-neutral-100 rounded-xl flex flex-col items-center justify-center text-neutral-400 border border-neutral-200 ${className}`}
    role="img"
    aria-label="Mapa aptek"
  >
    <div className="w-14 h-14 bg-neutral-200 rounded-full flex items-center justify-center mb-3">
      <MapIcon size={26} className="text-neutral-400" />
    </div>
    <p className="text-sm font-medium text-neutral-500">{message ?? 'Mapa aptek'}</p>
    <p className="text-xs text-neutral-400 mt-0.5">Integracja z Google Maps</p>
  </div>
);

const isGeocoded = (p: Pharmacy): p is Pharmacy & { latitude: number; longitude: number } =>
  typeof p.latitude === 'number' && typeof p.longitude === 'number';

const inBounds = (lat: number, lng: number, b: MapBounds) =>
  lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east;

// ---------- Grupowanie pinezek (clustering) ----------
// Dzieli widoczne apteki na komórki siatki zależne od zoomu, aby na mapie nie
// pojawiały się dziesiątki nakładających się pinezek. Liczba aptek w grupie jest
// pokazywana w dymku (informacja nie ginie), a kliknięcie przybliża do grupy.

type GeoPharmacy = Pharmacy & { latitude: number; longitude: number };
type Cluster = { id: string; lat: number; lng: number; items: GeoPharmacy[] };

const CLUSTER_CELL_PX = 64;

const buildClusters = (items: GeoPharmacy[], zoom: number): Cluster[] => {
  const cellDeg = (360 / (256 * 2 ** Math.max(zoom, 1))) * CLUSTER_CELL_PX;
  const cells: Record<string, GeoPharmacy[]> = {};
  for (const p of items) {
    const key = `${Math.floor(p.longitude / cellDeg)}_${Math.floor(p.latitude / cellDeg)}`;
    (cells[key] ??= []).push(p);
  }
  return Object.entries(cells).map(([id, bucket]) => ({
    id,
    lat: bucket.reduce((s, p) => s + p.latitude, 0) / bucket.length,
    lng: bucket.reduce((s, p) => s + p.longitude, 0) / bucket.length,
    items: bucket,
  }));
};

const availabilityColorOf = (items: GeoPharmacy[]): string =>
  items.some(p => p.prescriptionAvailability === 'FULL') ? FULL_AVAILABILITY_PIN.background
  : items.some(p => p.prescriptionAvailability === 'PARTIAL') ? PARTIAL_AVAILABILITY_PIN.background
  : DEFAULT_PIN.background;

const MapPanner = ({ center, zoom }: { center: LatLng; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    if (zoom != null) map.setZoom(zoom);
  }, [map, center, zoom]);
  return null;
};

interface MapContentProps {
  pharmacies: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  defaultZoom?: number;
  className: string;
}

const MapContent = ({
  pharmacies, selectedId, onSelect, onLoadInArea, onBoundsChange, onVisibleChange,
  userLocation, searchCity, defaultZoom = DEFAULT_ZOOM, className,
}: MapContentProps) => {
  const isLoaded = useApiIsLoaded();
  const [center, setCenter] = useState<LatLng>(userLocation ?? DEFAULT_CENTER);
  const [zoomTarget, setZoomTarget] = useState<number | undefined>(undefined);
  const [zoom, setZoom] = useState<number>(defaultZoom);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [displayed, setDisplayed] = useState<Pharmacy[]>(pharmacies);

  const onVisibleChangeRef = useRef(onVisibleChange);
  useEffect(() => { onVisibleChangeRef.current = onVisibleChange; });

  useEffect(() => { setDisplayed(pharmacies); }, [pharmacies]);

  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
      setZoomTarget(15);
    }
  }, [userLocation]);

  useEffect(() => {
    const selected = displayed.find(p => p.id === selectedId);
    if (selected && isGeocoded(selected)) {
      setCenter({ lat: selected.latitude, lng: selected.longitude });
      setZoomTarget(16);
    }
  }, [selectedId, displayed]);

  useEffect(() => {
    if (!isLoaded || !searchCity) return;
    new window.google.maps.Geocoder().geocode(
      { address: `${searchCity}, Poland` },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setCenter({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
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
          setDisplayed(prev => prev.map(p => (p.id === pharmacy.id ? { ...p, latitude: lat, longitude: lng } : p)));
          updatePharmacyLocation(pharmacy.name, pharmacy.address, pharmacy.city, lat, lng);
        },
      );
    });
  }, [isLoaded, pharmacies]);

  const visibleDisplayed = useMemo(() => {
    const geocoded = displayed.filter(isGeocoded);
    return mapBounds ? geocoded.filter(p => inBounds(p.latitude, p.longitude, mapBounds)) : geocoded;
  }, [displayed, mapBounds]);

  useEffect(() => { onVisibleChangeRef.current?.(visibleDisplayed); }, [visibleDisplayed]);

  // Apteka zaznaczona zawsze jako osobna pinezka; reszta podlega grupowaniu.
  const selectedPharmacy = useMemo(
    () => visibleDisplayed.find(p => p.id === selectedId) ?? null,
    [visibleDisplayed, selectedId],
  );
  const clusters = useMemo(
    () => buildClusters(visibleDisplayed.filter(p => p.id !== selectedId), zoom),
    [visibleDisplayed, selectedId, zoom],
  );

  const handleCameraChanged = useCallback((ev: { detail: { bounds?: MapBounds; zoom?: number } }) => {
    if (typeof ev.detail.zoom === 'number') setZoom(ev.detail.zoom);
    if (ev.detail.bounds) {
      setMapBounds(ev.detail.bounds);
      onBoundsChange?.(ev.detail.bounds);
    }
  }, [onBoundsChange]);

  const handleSearchArea = useCallback(() => {
    if (mapBounds) onLoadInArea?.(mapBounds);
  }, [mapBounds, onLoadInArea]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Map defaultCenter={center} defaultZoom={defaultZoom} mapId="DEMO_MAP_ID" gestureHandling="greedy" onCameraChanged={handleCameraChanged}>
        {clusters.map(cluster => {
          if (cluster.items.length === 1) {
            const p = cluster.items[0];
            const pinByAvailability =
              p.prescriptionAvailability === 'FULL' ? FULL_AVAILABILITY_PIN
              : p.prescriptionAvailability === 'PARTIAL' ? PARTIAL_AVAILABILITY_PIN
              : null;
            return (
              <AdvancedMarker key={p.id} position={{ lat: p.latitude, lng: p.longitude }} title={p.name} onClick={() => onSelect?.(p.id)}>
                {pinByAvailability ? <Pin {...pinByAvailability} scale={1.1} /> : <Pin {...DEFAULT_PIN} />}
              </AdvancedMarker>
            );
          }
          const count = cluster.items.length;
          const size = count < 10 ? 36 : count < 50 ? 44 : 52;
          return (
            <AdvancedMarker
              key={cluster.id}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              title={`${count} aptek — kliknij, aby przybliżyć`}
              onClick={() => {
                setCenter({ lat: cluster.lat, lng: cluster.lng });
                setZoomTarget(Math.min(zoom + 3, 20));
              }}
            >
              <div
                className="flex items-center justify-center rounded-full text-white font-black shadow-lg ring-2 ring-white"
                style={{ width: size, height: size, background: availabilityColorOf(cluster.items), fontSize: count < 100 ? 13 : 11 }}
              >
                {count}
              </div>
            </AdvancedMarker>
          );
        })}

        {selectedPharmacy && (
          <AdvancedMarker
            key={`selected-${selectedPharmacy.id}`}
            position={{ lat: selectedPharmacy.latitude, lng: selectedPharmacy.longitude }}
            title={selectedPharmacy.name}
            onClick={() => onSelect?.(selectedPharmacy.id)}
          >
            <Pin {...SELECTED_PIN} scale={1.3} />
          </AdvancedMarker>
        )}

        {userLocation && (
          <AdvancedMarker position={userLocation} title="Twoja lokalizacja">
            <div className="w-4 h-4 rounded-full bg-brand-600 border-[3px] border-white shadow-md" />
          </AdvancedMarker>
        )}

        <MapPanner center={center} zoom={zoomTarget} />
      </Map>

      {onLoadInArea && (
        <button
          type="button"
          onClick={handleSearchArea}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 bg-white shadow-lg px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 border border-neutral-200 whitespace-nowrap"
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
  pharmacies?: Pharmacy[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onLoadInArea?: (bounds: MapBounds) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  onVisibleChange?: (visible: Pharmacy[]) => void;
  userLocation?: LatLng | null;
  searchCity?: string;
  defaultZoom?: number;
  className?: string;
}

const PharmacyMapView = ({
  pharmacies = [], selectedId, onSelect, onLoadInArea, onBoundsChange, onVisibleChange,
  userLocation, searchCity, defaultZoom, className = '',
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
        onBoundsChange={onBoundsChange}
        onVisibleChange={onVisibleChange}
        userLocation={userLocation}
        searchCity={searchCity}
        defaultZoom={defaultZoom}
        className={className}
      />
    </APIProvider>
  );
};

export default PharmacyMapView;
