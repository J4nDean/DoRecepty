import { useMemo, useState } from 'react';
import { Archive } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { SearchBar } from '../components/SearchBar';
import { Spinner, EmptyState, SectionHeading } from '../components/ui';
import { fieldClass, CARD_GRID } from '../lib/theme';
import { usePrescriptions } from '../hooks/usePrescriptions';

const ArchivedPrescriptionsPage = () => {
  const { prescriptions, isLoading, options: archiveOptions } = usePrescriptions('ARCHIVED');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
          className={`${fieldClass()} h-11 px-3 min-w-[180px]`}
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
          <SectionHeading dot="bg-neutral-300" label="Wyniki wyszukiwania" count={filtered.length} className="mb-6" />
          <div className={`${CARD_GRID} gap-4`}>
            {filtered.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ArchivedPrescriptionsPage;
