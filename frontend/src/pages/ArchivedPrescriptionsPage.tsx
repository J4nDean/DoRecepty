import { useEffect, useMemo, useState } from 'react';
import { Archive } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { SearchBar } from '../components/SearchBar';
import { Spinner, EmptyState } from '../components/ui';
import { useMetadata } from '../MetadataContext';
import { fetchPrescriptions } from '../api';
import type { Prescription } from '../types';

const ArchivedPrescriptionsPage = () => {
  const { metadata, byCategory } = useMetadata();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const archiveOptions = useMemo(() => byCategory(metadata.prescriptionStatuses, 'ARCHIVED'), [metadata, byCategory]);
  const archiveCodes = useMemo(() => archiveOptions.map(o => o.code), [archiveOptions]);

  useEffect(() => {
    if (archiveCodes.length === 0) return;
    fetchPrescriptions()
      .then(data => setPrescriptions(data.filter(p => archiveCodes.includes(p.status))))
      .catch(() => setPrescriptions([]))
      .finally(() => setIsLoading(false));
  }, [archiveCodes]);

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

  return (
    <AppLayout title="Archiwalne e-recepty" subtitle="Historia zrealizowanych recept">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchBar placeholder="Szukaj po numerze, leku lub lekarzu..." onSearch={setQuery} className="flex-1" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filtruj po statusie"
          className="h-11 px-3 border border-neutral-200 rounded-xl text-sm text-neutral-700 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-600/20 transition-all min-w-[180px]"
        >
          <option value="">Wszystkie statusy</option>
          {archiveOptions.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || statusFilter ? 'Brak wyników' : 'Brak archiwalnych recept'}
          description={
            query || statusFilter ? 'Spróbuj zmienić kryteria wyszukiwania.' : 'Zrealizowane recepty pojawią się tutaj.'
          }
          icon={<Archive size={44} />}
        />
      ) : (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300 shadow-sm" />
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">
              Wyniki wyszukiwania <span className="text-neutral-400 font-medium ml-1">({filtered.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filtered.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ArchivedPrescriptionsPage;
