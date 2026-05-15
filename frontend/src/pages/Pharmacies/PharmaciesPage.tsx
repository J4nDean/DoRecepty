import { useCallback, useEffect, useState } from 'react';
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
import { geocodeAddress } from '../../services/geocoding';
import type { Pharmacy } from '../../types/pharmacy';

type LatLng = { lat: number; lng: number };
type MapBounds = { north: number; south: number; east: number; west: number };

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [visiblePharmacies, setVisiblePharmacies] = useState<Pharmacy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const loadNearby = async () => {
    setIsLocating(true);
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setLocationError(null);
    try {
      const { lat, lng } = await getUserLocation();
      setUserLocation({ lat, lng });
      const results = await fetchNearbyByLocation(lat, lng, 20, 200);
      setPharmacies(results);
      setSearchCity(undefined);
    } catch (err) {
      const isGeoErr =
        typeof err === 'object' && err !== null && 'code' in err && 'PERMISSION_DENIED' in (err as object);
      const msg = isGeoErr
        ? 'Brak zgody na dostęp do lokalizacji'
        : err instanceof Error
          ? err.message
          : 'Nie udało się pobrać lokalizacji';
      setLocationError(msg);
      setPharmacies([]);
    } finally {
      setIsLoading(false);
      setIsLocating(false);
    }
  };

  // On mount: just get user location to center the map — don't auto-load pharmacies.
  // Pharmacies load only after user clicks "Szukaj aptek w tym obszarze" or searches by city.
  useEffect(() => {
    getUserLocation()
      .then(setUserLocation)
      .catch(() => {
        /* user denied location — map shows at default center */
      });
  }, []);

  const handleSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setSearchCity(q);
    setLocationError(null);
    try {
      // Geocode city → redirect map there + fetch a bbox around the city center so we
      // pick up pharmacies physically in the area regardless of their administrative city
      // (e.g. Warszawa pharmacies near the Ząbki border show up when searching "Ząbki").
      const center = await geocodeAddress(`${q}, Poland`);
      const tasks: Promise<Pharmacy[]>[] = [searchPharmacies(q)];
      if (center) {
        const dLat = 0.05;             // ~5.5 km
        const dLng = 0.05 / Math.cos((center.lat * Math.PI) / 180);
        tasks.push(fetchPharmaciesInBounds({
          north: center.lat + dLat,
          south: center.lat - dLat,
          east: center.lng + dLng,
          west: center.lng - dLng,
        }));
      }
      const groups = await Promise.all(tasks);
      const merged = new Map<string, Pharmacy>();
      groups.flat().forEach(p => {
        const existing = merged.get(p.id);
        if (!existing || (!existing.latitude && p.latitude)) merged.set(p.id, p);
      });
      setPharmacies([...merged.values()]);
    } catch {
      const results = await searchPharmacies(q);
      setPharmacies(results);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadInArea = async (bounds: MapBounds) => {
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setSearchCity(undefined);
    setLocationError(null);
    try {
      // Pure coordinate search — no city detection. Returns only pharmacies whose
      // lat/lng lie inside the current viewport, regardless of administrative city.
      const results = await fetchPharmaciesInBounds(bounds);
      setPharmacies(results);
    } catch {
      setLocationError('Nie udało się pobrać aptek dla tego obszaru');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibleChange = useCallback((visible: Pharmacy[]) => {
    setVisiblePharmacies(visible);
  }, []);

  // Use visible pharmacies for list (falls back to all if map not ready yet)
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

      {locationError && (
        <p className="mb-4 text-xs text-amber-600">{locationError}</p>
      )}

      {searched && !isLoading && listPharmacies.length > 0 && (
        <p className="text-xs text-slate-400 mb-4">
          {searchCity
            ? `Znaleziono ${listPharmacies.length} aptek w "${searchCity}"`
            : `Widocznych aptek: ${listPharmacies.length}`}{' '}
          · {openCount} otwartych
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-240px)] lg:min-h-[400px]">
        <PharmacyMapView
          pharmacies={pharmacies}
          selectedId={selectedId}
          onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
          onLoadInArea={handleLoadInArea}
          onVisibleChange={handleVisibleChange}
          userLocation={userLocation}
          searchCity={searchCity}
          className="h-[55vh] -mx-5 md:-mx-6 lg:mx-0 lg:h-auto lg:flex-1 rounded-none lg:rounded-xl"
        />

        <div className="space-y-3 lg:w-80 lg:overflow-y-auto lg:pr-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
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
                pharmacy={p}
                selected={selectedId === p.id}
                onClick={() => setSelectedId(prev => (prev === p.id ? null : p.id))}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PharmaciesPage;
