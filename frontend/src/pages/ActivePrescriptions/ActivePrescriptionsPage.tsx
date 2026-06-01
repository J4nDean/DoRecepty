import { useEffect, useMemo, useState } from 'react';
import { FileCheck, Calendar, Clock } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PrescriptionCard } from '../../components/PrescriptionCard';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useMetadata } from '../../context/MetadataContext';
import { fetchPrescriptions } from '../../services/prescriptionService';
import type { Prescription } from '../../types/prescription';

type SortBy = 'newest' | 'expiring';

const Section = ({
  dot, label, prescriptions,
}: { dot: string; label: string; prescriptions: Prescription[] }) => (
  <section>
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label} ({prescriptions.length})
      </h2>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {prescriptions.map(p => (
        <PrescriptionCard key={p.id} prescription={p} />
      ))}
    </div>
  </section>
);

const SortButton = ({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`}
  >
    {icon}
    {label}
  </button>
);

const ActivePrescriptionsPage = () => {
  const { user } = useAuth();
  const { metadata, byCategory } = useMetadata();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const activeCodes = useMemo(
    () => byCategory(metadata.prescriptionStatuses, 'ACTIVE').map(o => o.code),
    [metadata, byCategory],
  );

  useEffect(() => {
    if (activeCodes.length === 0 || !user?.pesel) return;
    fetchPrescriptions(user.pesel)
      .then(data => setPrescriptions(data.filter(p => activeCodes.includes(p.status))))
      .finally(() => setIsLoading(false));
  }, [activeCodes, user?.pesel]);

  const sorted = useMemo(() => {
    const list = [...prescriptions];
    return sortBy === 'expiring'
      ? list.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      : list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [prescriptions, sortBy]);

  const active  = sorted.filter(p => p.status === 'AKTYWNA');
  const partial = sorted.filter(p => p.status === 'CZĘŚCIOWO_ZREALIZOWANA');

  return (
    <AppLayout title="Aktywne e-recepty" subtitle="Recepty wymagające realizacji">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-medium text-slate-600 w-full sm:w-auto">Sortuj:</span>
        <SortButton
          active={sortBy === 'newest'}
          onClick={() => setSortBy('newest')}
          icon={<Calendar size={15} />}
          label="Najnowsze"
        />
        <SortButton
          active={sortBy === 'expiring'}
          onClick={() => setSortBy('expiring')}
          icon={<Clock size={15} />}
          label="Wygasające"
        />
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
          {active.length  > 0 && <Section dot="bg-emerald-500" label="Aktywne"               prescriptions={active} />}
          {partial.length > 0 && <Section dot="bg-amber-400"   label="Częściowo zrealizowane" prescriptions={partial} />}
        </div>
      )}
    </AppLayout>
  );
};

export default ActivePrescriptionsPage;
