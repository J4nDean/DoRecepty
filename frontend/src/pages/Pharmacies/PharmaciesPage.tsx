import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PharmacyCard } from '../../components/PharmacyCard';
import { SearchBar } from '../../components/SearchBar';
import PharmacyMapView from '../../components/PharmacyMapView';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  searchPharmacies,
  fetchPharmaciesInBounds,
  fetchNearbyByLocation,
  getUserLocation,
} from '../../services/pharmacyService';
import { geocodeAddress, reverseGeocode } from '../../services/geocoding';
import type { Pharmacy } from '../../types/pharmacy';

type LatLng    = { lat: number; lng: number };
type MapBounds = { north: number; south: number; east: number; west: number };

const CITY_BBOX_DELTA = 0.05;
const NEARBY_RADIUS_KM = 20;
const NEARBY_LIMIT     = 200;

const isPermissionDenied = (err: unknown) =>
  typeof err === 'object' && err !== null && 'code' in err && 'PERMISSION_DENIED' in (err as object);

const locationErrorMessage = (err: unknown): string => {
  if (isPermissionDenied(err)) return 'Brak zgody na dostęp do lokalizacji';
  return err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
};

function mergePharmacies(...groups: Pharmacy[][]): Pharmacy[] {
  const map = new Map<string, Pharmacy>();
  for (const pharmacy of groups.flat()) {
    const existing = map.get(pharmacy.id);
    if (!existing || (!existing.latitude && pharmacy.latitude)) {
      map.set(pharmacy.id, pharmacy);
    }
  }
  return [...map.values()];
}

const bboxAround = ({ lat, lng }: LatLng, delta = CITY_BBOX_DELTA): MapBounds => {
  const dLng = delta / Math.cos((lat * Math.PI) / 180);
  return {
    north: lat + delta, south: lat - delta,
    east:  lng + dLng,  west:  lng - dLng,
  };
};

const PharmaciesPage = () => {
  const [pharmacies,        setPharmacies]        = useState<Pharmacy[]>([]);
  const [visiblePharmacies, setVisiblePharmacies] = useState<Pharmacy[]>([]);
  const [selectedId,        setSelectedId]        = useState<string | null>(null);
  const [searchCity,        setSearchCity]        = useState<string | undefined>(undefined);
  const [isLoading,         setIsLoading]         = useState(false);
  const [searched,          setSearched]          = useState(false);
  const [isLocating,        setIsLocating]        = useState(false);
  const [locationError,     setLocationError]     = useState<string | null>(null);
  const [userLocation,      setUserLocation]      = useState<LatLng | null>(null);

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerCard = (id: string) => (element: HTMLElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  useEffect(() => {
    getUserLocation().then(setUserLocation).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const card = cardRefs.current.get(selectedId);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const resetForNewSearch = (city?: string) => {
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);
    setSelectedId(null);
    setLocationError(null);
    setSearchCity(city);
  };

  const loadNearby = async () => {
    setIsLocating(true);
    resetForNewSearch(undefined);
    try {
      const { lat, lng } = await getUserLocation();
      setUserLocation({ lat, lng });
      setPharmacies(await fetchNearbyByLocation(lat, lng, NEARBY_RADIUS_KM, NEARBY_LIMIT));
    } catch (err) {
      setLocationError(locationErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsLocating(false);
    }
  };

  const handleSearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    resetForNewSearch(trimmed);

    try {
      const center = await geocodeAddress(`${trimmed}, Poland`);
      const tasks: Promise<Pharmacy[]>[] = [searchPharmacies(trimmed)];
      if (center) tasks.push(fetchPharmaciesInBounds(bboxAround(center)));
      setPharmacies(mergePharmacies(...await Promise.all(tasks)));
    } catch {
      setPharmacies(await searchPharmacies(trimmed));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadInArea = async (bounds: MapBounds) => {
    resetForNewSearch(undefined);
    try {
      const inBounds = await fetchPharmaciesInBounds(bounds);
      if (inBounds.length > 0) {
        setPharmacies(inBounds);
        return;
      }

      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east  + bounds.west)  / 2;
      const city = await reverseGeocode(centerLat, centerLng);
      if (city) {
        setSearchCity(city);
        setPharmacies(await searchPharmacies(city));
      } else {
        setLocationError('Nie udało się rozpoznać miasta dla tego obszaru — spróbuj wpisać nazwę ręcznie');
      }
    } catch {
      setLocationError('Nie udało się pobrać aptek dla tego obszaru');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibleChange = useCallback((visible: Pharmacy[]) => {
    setVisiblePharmacies(visible);
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const listPharmacies = visiblePharmacies.length > 0 || pharmacies.length === 0
    ? visiblePharmacies
    : pharmacies;
  const openCount = listPharmacies.filter(p => p.isOpen).length;

  return (
    <AppLayout title="Najbliższe apteki" subtitle="Znajdź aptekę w swojej okolicy">
      <SearchBar
        placeholder="Wpisz miasto lub adres..."
        onSearch={handleSearch}
        onLocate={loadNearby}
        isLocating={isLocating}
        className="mb-4 max-w-lg"
      />

      {locationError && <p className="mb-4 text-xs text-amber-600">{locationError}</p>}

      {searched && !isLoading && listPharmacies.length > 0 && (
        <p className="text-xs text-slate-400 mb-4">
          {searchCity
            ? `Znaleziono ${listPharmacies.length} aptek w "${searchCity}"`
            : `Widocznych aptek: ${listPharmacies.length}`}
          {' '}· {openCount} otwartych
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-240px)] lg:min-h-[400px]">
        <PharmacyMapView
          pharmacies={pharmacies}
          selectedId={selectedId}
          onSelect={handleSelect}
          onLoadInArea={handleLoadInArea}
          onVisibleChange={handleVisibleChange}
          userLocation={userLocation}
          searchCity={searchCity}
          className="h-[52dvh] min-h-[300px] -mx-5 md:-mx-6 lg:mx-0 lg:h-auto lg:min-h-0 lg:flex-1 rounded-none lg:rounded-xl"
        />

        <div className="h-[38dvh] overflow-y-auto overscroll-contain space-y-3 pb-2 lg:h-auto lg:w-80 lg:overflow-y-auto lg:pr-1 scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : !searched ? (
            <EmptyState
              title="Wyszukaj aptekę"
              description="Przesuń mapę na interesujący Cię obszar i kliknij Szukaj w tym obszarze, wpisz miasto lub użyj celownika."
              icon={<MapPin size={40} />}
            />
          ) : listPharmacies.length === 0 ? (
            <EmptyState
              title="Nie znaleziono aptek"
              description="Spróbuj wpisać inną lokalizację lub zezwól na geolokalizację."
              icon={<MapPin size={40} />}
            />
          ) : (
            listPharmacies.map(p => (
              <PharmacyCard
                key={p.id}
                ref={registerCard(p.id)}
                pharmacy={p}
                selected={selectedId === p.id}
                onClick={() => handleSelect(p.id)}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PharmaciesPage;
