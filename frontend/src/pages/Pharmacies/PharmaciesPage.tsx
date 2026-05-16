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

type LatLng   = { lat: number; lng: number };
type MapBounds = { north: number; south: number; east: number; west: number };

// Merges pharmacy arrays, preferring entries that already have coordinates.
function mergePharmacies(...groups: Pharmacy[][]): Pharmacy[] {
  const map = new Map<string, Pharmacy>();
  groups.flat().forEach(p => {
    const existing = map.get(p.id);
    if (!existing || (!existing.latitude && p.latitude)) map.set(p.id, p);
  });
  return [...map.values()];
}

const PharmaciesPage = () => {
  const [pharmacies,       setPharmacies]       = useState<Pharmacy[]>([]);
  const [visiblePharmacies, setVisiblePharmacies] = useState<Pharmacy[]>([]);
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [searchCity,       setSearchCity]       = useState<string | undefined>(undefined);
  const [isLoading,        setIsLoading]        = useState(false);
  const [searched,         setSearched]         = useState(false);
  const [isLocating,       setIsLocating]       = useState(false);
  const [locationError,    setLocationError]    = useState<string | null>(null);
  const [userLocation,     setUserLocation]     = useState<LatLng | null>(null);

  // On mount: centre the map on the user without loading any pharmacies.
  useEffect(() => {
    getUserLocation()
      .then(setUserLocation)
      .catch(() => { /* denied — map shows default centre */ });
  }, []);

  // ── Locate nearby ──────────────────────────────────────────────────────────

  const loadNearby = async () => {
    setIsLocating(true);
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);       // clear old pins immediately
    setSelectedId(null);
    setLocationError(null);
    try {
      const { lat, lng } = await getUserLocation();
      setUserLocation({ lat, lng });
      setPharmacies(await fetchNearbyByLocation(lat, lng, 20, 200));
      setSearchCity(undefined);
    } catch (err) {
      const msg =
        typeof err === 'object' && err !== null && 'code' in err && 'PERMISSION_DENIED' in (err as object)
          ? 'Brak zgody na dostęp do lokalizacji'
          : err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
      setLocationError(msg);
    } finally {
      setIsLoading(false);
      setIsLocating(false);
    }
  };

  // ── City search ────────────────────────────────────────────────────────────

  const handleSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);       // clear old pins immediately
    setSelectedId(null);
    setSearchCity(q);
    setLocationError(null);
    try {
      // Geocode the city to get a bbox, then fetch both by name and by coordinates.
      // This ensures pharmacies near administrative boundaries (e.g. Warsaw/Ząbki)
      // are included even when their registered city differs from the search term.
      const center = await geocodeAddress(`${q}, Poland`);
      const tasks: Promise<Pharmacy[]>[] = [searchPharmacies(q)];
      if (center) {
        const dLat = 0.05;
        const dLng = 0.05 / Math.cos((center.lat * Math.PI) / 180);
        tasks.push(fetchPharmaciesInBounds({
          north: center.lat + dLat, south: center.lat - dLat,
          east:  center.lng + dLng, west:  center.lng - dLng,
        }));
      }
      setPharmacies(mergePharmacies(...await Promise.all(tasks)));
    } catch {
      setPharmacies(await searchPharmacies(q));
    } finally {
      setIsLoading(false);
    }
  };

  // ── "Search in this area" button ───────────────────────────────────────────

  const handleLoadInArea = async (bounds: MapBounds, cities: string[]) => {
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);       // clear old pins immediately
    setSelectedId(null);
    setSearchCity(undefined);
    setLocationError(null);
    try {
      // Fetch geocoded pharmacies that are physically inside the viewport, plus
      // ungeocoded pharmacies from every city detected in the viewport (so the
      // client-side geocoder can place them; the visible filter ensures only
      // in-bounds entries reach the list).
      const [inBounds, ...byCities] = await Promise.all([
        fetchPharmaciesInBounds(bounds),
        ...cities.map(c => searchPharmacies(c)),
      ]);
      setPharmacies(mergePharmacies(inBounds, ...byCities));
    } catch {
      setLocationError('Nie udało się pobrać aptek dla tego obszaru');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Visible list ───────────────────────────────────────────────────────────

  const handleVisibleChange = useCallback((visible: Pharmacy[]) => {
    setVisiblePharmacies(visible);
  }, []);

  // The list shows only pharmacies confirmed to be inside the viewport.
  // Falls back to the full set while the map is still computing bounds on first load.
  const listPharmacies = visiblePharmacies.length > 0 || pharmacies.length === 0
    ? visiblePharmacies
    : pharmacies;

  const openCount = listPharmacies.filter(p => p.isOpen).length;

  // ── Render ─────────────────────────────────────────────────────────────────

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
            : `Widocznych aptek: ${listPharmacies.length}`
          }{' '}· {openCount} otwartych
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-240px)] lg:min-h-[400px]">
        <PharmacyMapView
          pharmacies={pharmacies}
          selectedId={selectedId}
          onSelect={id => setSelectedId(prev => prev === id ? null : id)}
          onLoadInArea={handleLoadInArea}
          onVisibleChange={handleVisibleChange}
          userLocation={userLocation}
          searchCity={searchCity}
          className="h-[50vh] min-h-[320px] -mx-5 md:-mx-6 lg:mx-0 lg:h-auto lg:min-h-0 lg:flex-1 rounded-none lg:rounded-xl"
        />

        <div className="space-y-3 lg:w-80 lg:overflow-y-auto lg:pr-1">
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
                pharmacy={p}
                selected={selectedId === p.id}
                onClick={() => setSelectedId(prev => prev === p.id ? null : p.id)}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PharmaciesPage;
