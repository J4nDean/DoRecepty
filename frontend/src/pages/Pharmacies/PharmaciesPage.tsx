import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PharmacyCard } from '../../components/PharmacyCard';
import { SearchBar } from '../../components/SearchBar';
import PharmacyMapView from '../../components/PharmacyMapView';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { searchPharmacies } from '../../services/pharmacyService';
import type { Pharmacy } from '../../types/pharmacy';

const PharmaciesPage = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    setSelectedId(null);
    setSearchCity(query.trim());
    const results = await searchPharmacies(query.trim());
    setPharmacies(results);
    setIsLoading(false);
  };

  const openCount = pharmacies.filter(p => p.isOpen).length;

  return (
    <AppLayout title="Najbliższe apteki" subtitle="Znajdź aptekę w swojej okolicy">
      {/* Search bar */}
      <SearchBar
        placeholder="Wpisz miasto lub adres..."
        onSearch={handleSearch}
        className="mb-4 max-w-lg"
      />

      {/* Summary */}
      {searched && !isLoading && pharmacies.length > 0 && (
        <p className="text-xs text-slate-400 mb-4">
          Znaleziono {pharmacies.length} aptek · {openCount} otwartych
        </p>
      )}

      {/* Main layout: map + list */}
      <div
        className="flex flex-col lg:flex-row gap-4"
        style={{ height: 'calc(100vh - 240px)', minHeight: 400 }}
      >
        {/* Google Map */}
        <PharmacyMapView
          pharmacies={pharmacies}
          selectedId={selectedId}
          onSelect={id => setSelectedId(prev => (prev === id ? null : id))}
          searchCity={searchCity}
          className="h-64 lg:h-auto lg:flex-1"
        />

        {/* Pharmacy list */}
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
              description="Spróbuj wpisać inną lokalizację."
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
