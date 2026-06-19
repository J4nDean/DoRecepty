import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, ArrowDownAZ, ArrowUpDown, Star, History as HistoryIcon, X, Navigation } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PharmacyCard } from '../components/PharmacyCard';
import { SearchBar } from '../components/SearchBar';
import PharmacyMapView from '../components/PharmacyMapView';
import { Spinner, EmptyState } from '../components/ui';
import {
  searchPharmacies, fetchPharmaciesInBounds, approxBounds, getUserLocation, reverseGeocode,
} from '../lib/api';
import { useFavoritePharmacies } from '../hooks/useFavoritePharmacies';
import { withDistance, buildDirectionsUrl, type LatLng } from '../lib/utils';
import type { Pharmacy } from '../types';

type MapBounds = { north: number; south: number; east: number; west: number };
type SortMode = 'default' | 'distance' | 'name';

const HISTORY_KEY = 'pharmacy_search_history';

const isPermissionDenied = (err: unknown) =>
  typeof err === 'object' && err !== null && 'code' in err && 'PERMISSION_DENIED' in (err as object);

const locationErrorMessage = (err: unknown): string => {
  if (isPermissionDenied(err)) return 'Brak zgody na dostęp do lokalizacji';
  return err instanceof Error ? err.message : 'Nie udało się pobrać lokalizacji';
};

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string | undefined>(undefined);
  const [mapCenterCity, setMapCenterCity] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [visiblePharmacies, setVisiblePharmacies] = useState<Pharmacy[]>([]);

  const { isFavorite, toggleFavorite, favorites } = useFavoritePharmacies();
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerCard = (id: string) => (element: HTMLElement | null) => {
    if (element) cardRefs.current.set(id, element);
    else cardRefs.current.delete(id);
  };

  useEffect(() => {
    loadNearby();
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const card = cardRefs.current.get(selectedId);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  const handleLoadInArea = async (bounds: MapBounds) => {
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);
    setSelectedId(null);
    setLocationError(null);
    setMapCenterCity(undefined);

    try {
      const inBounds = await fetchPharmaciesInBounds(bounds);
      if (inBounds.length > 0) {
        setPharmacies(inBounds);
        return;
      }
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      const city = await reverseGeocode(centerLat, centerLng);
      if (city) {
        setSearchCity(city);
        addToHistory(city);
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

  const addToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSearchHistory(prev => {
      const next = [trimmed, ...prev.filter(h => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const resetForNewSearch = (city?: string) => {
    setIsLoading(true);
    setSearched(true);
    setPharmacies([]);
    setSelectedId(null);
    setLocationError(null);
    setSearchCity(city);
    setMapCenterCity(city);
  };

  const loadNearby = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const pos = await getUserLocation();
      setUserLocation(pos);
      setSortMode('distance');
      resetForNewSearch(undefined);
      try {
        setPharmacies(await fetchPharmaciesInBounds(approxBounds(pos.lat, pos.lng)));
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('GPS Error:', err);
      setLocationError(locationErrorMessage(err));
    } finally {
      setIsLocating(false);
    }
  };

  const handleCitySearch = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addToHistory(trimmed);
    resetForNewSearch(trimmed);
    try {
      setPharmacies(await searchPharmacies(trimmed));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (id: string) => setSelectedId(prev => (prev === id ? null : id));

  const pharmaciesWithDistance = useMemo(
    () => withDistance(pharmacies, userLocation),
    [pharmacies, userLocation],
  );

  const listPharmacies = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    let list = pharmaciesWithDistance;

    if (showFavoritesOnly) list = list.filter(p => isFavorite(p.id));
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
      );
    }

    if (sortMode === 'distance') {
      list = [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    } else if (sortMode === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pl'));
    }
    return list;
  }, [pharmaciesWithDistance, nameFilter, sortMode, showFavoritesOnly, isFavorite]);

  const selectedPharmacy = useMemo(
    () => pharmaciesWithDistance.find(p => p.id === selectedId) ?? null,
    [pharmaciesWithDistance, selectedId],
  );

  const openCount = visiblePharmacies.filter(p => p.isOpen).length;
  const cycleSortMode = () =>
    setSortMode(prev => (prev === 'default' ? 'distance' : prev === 'distance' ? 'name' : 'default'));

  const sortLabel =
    sortMode === 'distance' ? 'Od najbliższej' : sortMode === 'name' ? 'A → Z' : 'Domyślnie';

  return (
    <AppLayout title="Najbliższe apteki" subtitle="Znajdź aptekę w swojej okolicy">
      <SearchBar
        placeholder="Wpisz nazwę apteki, miasto lub adres..."
        onSearch={handleCitySearch}
        onValueChange={setNameFilter}
        onLocate={loadNearby}
        isLocating={isLocating}
        className="mb-3 max-w-lg"
      />

      {searchHistory.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 -mt-1">
          <div className="flex items-center gap-1.5 text-neutral-400 mr-1">
            <HistoryIcon size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ostatnie:</span>
          </div>
          {searchHistory.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => handleCitySearch(h)}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
            >
              {h}
            </button>
          ))}
          <button
            type="button"
            onClick={clearHistory}
            className="text-neutral-400 hover:text-rose-500 p-1 transition-colors"
            title="Wyczyść historię"
          >
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={cycleSortMode}
          title="Zmień sortowanie"
          className="flex items-center gap-1.5 h-9 px-3 border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          {sortMode === 'name' ? <ArrowDownAZ size={14} /> : <ArrowUpDown size={14} />}
          {sortLabel}
        </button>
        <button
          type="button"
          onClick={() => setShowFavoritesOnly(prev => !prev)}
          aria-pressed={showFavoritesOnly}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-colors border ${
            showFavoritesOnly
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          <Star size={14} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          Ulubione ({favorites.size})
        </button>
      </div>

      {locationError && <p className="mb-4 text-xs text-amber-600">{locationError}</p>}

      {searched && !isLoading && visiblePharmacies.length > 0 && (
        <p className="text-xs text-neutral-400 mb-4">
          {searchCity
            ? `Znaleziono ${visiblePharmacies.length} aptek w "${searchCity}"`
            : `Widocznych aptek: ${visiblePharmacies.length}`}
          {' '}· {openCount} otwartych
          {sortMode === 'distance' && !userLocation && ' · udostępnij lokalizację dla sortowania po odległości'}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-300px)] lg:min-h-[400px]">
        <div className="flex flex-col gap-3 lg:flex-1 lg:min-h-0">
          <PharmacyMapView
            pharmacies={listPharmacies}
            selectedId={selectedId}
            onSelect={handleSelect}
            onLoadInArea={handleLoadInArea}
            onVisibleChange={setVisiblePharmacies}
            userLocation={userLocation}
            searchCity={mapCenterCity}
            className="h-[48dvh] min-h-[260px] -mx-4 sm:-mx-5 md:-mx-6 lg:mx-0 lg:h-auto lg:min-h-0 lg:flex-1 rounded-none lg:rounded-xl"
          />

          {selectedPharmacy ? (
            <a
              href={buildDirectionsUrl(selectedPharmacy, userLocation)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-black uppercase tracking-wide text-sm sm:text-base px-5 py-3.5 rounded-lg shadow-sm transition-colors"
            >
              <Navigation size={18} className="shrink-0" />
              Nawiguj do: {selectedPharmacy.name}
            </a>
          ) : (
            <p className="w-full flex items-center justify-center gap-2 bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 font-bold text-sm px-5 py-3.5 rounded-lg text-center">
              <MapPin size={16} className="shrink-0" />
              Zaznacz aptekę, aby wyznaczyć trasę
            </p>
          )}
        </div>

        <div className="h-[32dvh] min-h-[180px] overflow-y-auto overscroll-contain space-y-3 pb-2 lg:h-auto lg:w-80 lg:overflow-y-auto lg:pr-1 scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : !searched ? (
            <EmptyState
              title="Wyszukaj aptekę"
              description="Przesuń mapę na interesujący Cię obszar i kliknij Szukaj w tym obszarze, wpisz miasto lub użyj celownika."
              icon={<MapPin size={40} />}
            />
          ) : visiblePharmacies.length === 0 ? (
            <EmptyState
              title={showFavoritesOnly ? 'Brak ulubionych aptek' : 'Nie znaleziono aptek'}
              description={
                showFavoritesOnly
                  ? 'Dodaj apteki do ulubionych klikając gwiazdkę na karcie.'
                  : 'Spróbuj zmienić kryteria filtrowania lub wyszukać w innym mieście.'
              }
              icon={<MapPin size={40} />}
            />
          ) : (
            visiblePharmacies.map(p => (
              <PharmacyCard
                key={p.id}
                ref={registerCard(p.id)}
                pharmacy={p}
                selected={selectedId === p.id}
                onClick={() => handleSelect(p.id)}
                isFavorite={isFavorite(p.id)}
                onToggleFavorite={() => toggleFavorite(p.id)}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PharmaciesPage;
