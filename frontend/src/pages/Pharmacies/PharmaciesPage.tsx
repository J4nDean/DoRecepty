import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
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

type LatLng = { lat: number; lng: number };

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
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

  const handleLoadInArea = async (center: LatLng) => {
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setSearchCity(undefined);
    setLocationError(null);
    try {
      const results = await fetchNearbyByLocation(center.lat, center.lng, 20, 200);
      setPharmacies(results);
    } catch {
      setLocationError('Nie udało się pobrać aptek dla tego obszaru');
    } finally {
      setIsLoading(false);
    }
  };

  const openCount = pharmacies.filter(p => p.isOpen).length;

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
          onLoadInArea={handleLoadInArea}
          userLocation={userLocation}
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
              description="Wpisz miasto lub kliknij celownik, aby znaleźć apteki w pobliżu."
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
