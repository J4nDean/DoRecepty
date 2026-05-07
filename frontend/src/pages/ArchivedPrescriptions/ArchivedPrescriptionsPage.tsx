import { useEffect, useState, useMemo } from 'react';
import { Archive } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PrescriptionCard } from '../../components/PrescriptionCard';
import { SearchBar } from '../../components/SearchBar';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchPrescriptions } from '../../services/prescriptionService';
import type { Prescription } from '../../types/prescription';

const ARCHIVE_STATUSES = ['ZREALIZOWANA', 'ARCHIWALNA', 'ANULOWANA'];

const ArchivedPrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user?.pesel) return;
    fetchPrescriptions(user.pesel)
      .then(data =>
        setPrescriptions(data.filter(p => ARCHIVE_STATUSES.includes(p.status))),
      )
      .finally(() => setIsLoading(false));
  }, [user?.pesel]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return prescriptions.filter(p => {
      const matchesQuery =
        !q ||
        p.number.includes(q) ||
        p.doctorName.toLowerCase().includes(q) ||
        p.drugs.some(d => d.name.toLowerCase().includes(q));
      const matchesStatus = !statusFilter || p.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [prescriptions, query, statusFilter]);

  const resultLabel =
    filtered.length === 1
      ? '1 recepta'
      : `${filtered.length} recept${filtered.length >= 2 && filtered.length <= 4 ? 'y' : ''}`;

  return (
    <AppLayout title="Archiwalne e-recepty" subtitle="Historia zrealizowanych recept">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar
          placeholder="Szukaj po numerze, leku lub lekarzu..."
          onSearch={setQuery}
          className="flex-1"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filtruj po statusie"
          className="h-11 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all min-w-[180px]"
        >
          <option value="">Wszystkie statusy</option>
          <option value="ZREALIZOWANA">Zrealizowane</option>
          <option value="ARCHIWALNA">Archiwalne</option>
          <option value="ANULOWANA">Anulowane</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || statusFilter ? 'Brak wyników' : 'Brak archiwalnych recept'}
          description={
            query || statusFilter
              ? 'Spróbuj zmienić kryteria wyszukiwania.'
              : 'Zrealizowane recepty pojawią się tutaj.'
          }
          icon={<Archive size={44} />}
        />
      ) : (
        <div>
          <p className="text-xs text-slate-400 mb-4">Znaleziono: {resultLabel}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(p => (
              <PrescriptionCard key={p.id} prescription={p} />
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ArchivedPrescriptionsPage;
