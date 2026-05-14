import { useEffect, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PharmacyCard } from '../../components/PharmacyCard';
import { SearchBar } from '../../components/SearchBar';
import PharmacyMapView from '../../components/PharmacyMapView';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  searchPharmacies,
  fetchNearbyByLocation,
  getUserLocation,
} from '../../services/pharmacyService';
import type { Pharmacy } from '../../types/pharmacy';

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadNearby = async () => {
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setLocationError(null);
    try {
      const { lat, lng } = await getUserLocation();
      const results = await fetchNearbyByLocation(lat, lng, 10, 20);
      setPharmacies(results);
      setSearchCity(undefined);
    } catch (err) {
      const msg =
        err instanceof GeolocationPositionError
          ? 'Brak zgody na dostęp do lokalizacji'
          : err instanceof Error
            ? err.message
            : 'Nie udało się pobrać lokalizacji';
      setLocationError(msg);
      setPharmacies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNearby();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setSearchCity(query.trim());
    setLocationError(null);
    const results = await searchPharmacies(query.trim());
    setPharmacies(results);
    setIsLoading(false);
  };

  const openCount = pharmacies.filter(p => p.isOpen).length;

  return (
    <AppLayout title="Najbliższe apteki" subtitle="Znajdź aptekę w swojej okolicy">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchBar
          placeholder="Wpisz miasto lub adres..."
          onSearch={handleSearch}
          className="max-w-lg flex-1"
        />
        <button
          type="button"
          onClick={loadNearby}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Navigation size={16} />
          Użyj mojej lokalizacji
        </button>
      </div>

      {locationError && (
        <p className="mb-4 text-xs text-amber-600">{locationError}</p>
      )}

      {searched && !isLoading && pharmacies.length > 0 && (
        <p className="text-xs text-slate-400 mb-4">
          {searchCity
            ? `Znaleziono ${pharmacies.length} aptek w "${searchCity}"`
            : `Najbliżej Ciebie: ${pharmacies.length} aptek`}{' '}
          · {openCount} otwartych
        </p>
      )}

      <div
        className="flex flex-col lg:flex-row gap-4"
        style={{ height: 'calc(100vh - 240px)', minHeight: 400 }}
      >
        <PharmacyMapView
          pharmacies={pharmacies}
          selectedId={selectedId}
          onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
          searchCity={searchCity}
          className="h-64 lg:h-auto lg:flex-1"
        />

        <div className="lg:w-80 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : !searched ? (
            <EmptyState
              title="Wyszukaj aptekę"
              description="Wpisz miasto lub adres, aby znaleźć apteki w pobliżu."
              icon={<MapPin size={40} />}
            />
          ) : pharmacies.length === 0 ? (
            <EmptyState
              title="Nie znaleziono aptek"
              description="Spróbuj wpisać inną lokalizację lub zezwól na geolokalizację."
              icon={<MapPin size={40} />}
            />
          ) : (
            pharmacies.map(p => (
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
