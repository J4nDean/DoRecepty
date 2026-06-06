import { useEffect, useMemo, useState } from 'react';
import { FileCheck, Calendar, Clock } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { Spinner, EmptyState } from '../components/ui';
import { useMetadata } from '../MetadataContext';
import { fetchPrescriptions } from '../api';
import type { Prescription } from '../types';

type SortBy = 'newest' | 'expiring';

const Section = ({ dot, label, prescriptions }: { dot: string; label: string; prescriptions: Prescription[] }) => (
  <section>
    <div className="flex items-center gap-2 mb-6">
      <div className={`w-2.5 h-2.5 rounded-full ${dot} shadow-sm`} />
      <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">
        {label} <span className="text-neutral-400 font-medium ml-1">({prescriptions.length})</span>
      </h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
  const { metadata, byCategory, loaded } = useMetadata();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const activeCodes = useMemo(
    () => byCategory(metadata.prescriptionStatuses, 'ACTIVE').map(o => o.code),
    [metadata, byCategory],
  );

  useEffect(() => {
    if (!loaded) return;
    
    // Fallback in case metadata fails to load
    const validCodes = activeCodes.length > 0 ? activeCodes : ['AKTYWNA', 'CZĘŚCIOWO_ZREALIZOWANA', 'NIEZREALIZOWANA'];
    
    fetchPrescriptions()
      .then(data => setPrescriptions(data.filter(p => validCodes.includes(p.status))))
      .catch(() => setPrescriptions([]))
      .finally(() => setIsLoading(false));
  }, [loaded, activeCodes]);

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
