import { useMemo, useState } from 'react';
import { FileCheck, Calendar, Clock } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { Spinner, EmptyState, SectionHeading } from '../components/ui';
import { CARD_GRID } from '../lib/theme';
import { usePrescriptions } from '../hooks/usePrescriptions';
import type { Prescription } from '../types';

type SortBy = 'newest' | 'expiring';

const Section = ({ dot, label, prescriptions }: { dot: string; label: string; prescriptions: Prescription[] }) => (
  <section>
    <SectionHeading dot={dot} label={label} count={prescriptions.length} className="mb-6" />
    <div className={`${CARD_GRID} gap-4`}>
      {prescriptions.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
    </div>
  </section>
);

const SortButton = ({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ActivePrescriptionsPage = () => {
  const { prescriptions, isLoading } = usePrescriptions('ACTIVE');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const sorted = useMemo(() => {
    const list = [...prescriptions];
    return sortBy === 'expiring'
      ? list.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      : list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [prescriptions, sortBy]);

  const active = sorted.filter(p => p.status === 'AKTYWNA' || p.status === 'NIEZREALIZOWANA');
  const partial = sorted.filter(p => p.status === 'CZĘŚCIOWO_ZREALIZOWANA');

  return (
    <AppLayout title="Aktywne e-recepty" subtitle="Recepty wymagające realizacji">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-medium text-neutral-600 w-full sm:w-auto">Sortuj:</span>
        <SortButton active={sortBy === 'newest'} onClick={() => setSortBy('newest')} icon={<Calendar size={15} />} label="Najnowsze" />
        <SortButton active={sortBy === 'expiring'} onClick={() => setSortBy('expiring')} icon={<Clock size={15} />} label="Wygasające" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="Brak aktywnych recept"
          description="Wszystkie Twoje recepty zostały zrealizowane lub wygasły."
          icon={<FileCheck size={44} />}
        />
      ) : (
        <div className="space-y-10">
          {partial.length > 0 && <Section dot="bg-amber-400" label="Częściowo zrealizowane" prescriptions={partial} />}
          {active.length > 0 && <Section dot="bg-emerald-500" label="Aktywne" prescriptions={active} />}
        </div>
      )}
    </AppLayout>
  );
};

export default ActivePrescriptionsPage;
