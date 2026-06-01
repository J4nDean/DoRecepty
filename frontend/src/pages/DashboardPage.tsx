import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Archive, MapPin, ChevronRight, FileText } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { Spinner, EmptyState } from '../components/ui';
import { useAuth } from '../AuthContext';
import { useMetadata } from '../MetadataContext';
import { fetchPrescriptions } from '../api';
import type { Prescription } from '../types';

interface StatCardProps {
  to: string;
  icon: React.ReactNode;
  count: string | number;
  label: string;
}

const StatCard = ({ to, icon, count, label }: StatCardProps) => (
  <Link
    to={to}
    className="bg-white rounded-2xl border border-neutral-200 p-5 flex items-center gap-4 hover:border-neutral-300 hover:shadow-sm transition-all"
  >
    <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 text-white">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-neutral-900 leading-tight tracking-tight">{count}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
    </div>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const { metadata, byCategory } = useMetadata();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions()
      .then(setPrescriptions)
      .catch(() => setPrescriptions([]))
      .finally(() => setIsLoading(false));
  }, []);

  const activeCodes = byCategory(metadata.prescriptionStatuses, 'ACTIVE').map(o => o.code);
  const archivedCodes = byCategory(metadata.prescriptionStatuses, 'ARCHIVED').map(o => o.code);

  const recent = [...prescriptions]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 3);
  const activeCount = prescriptions.filter(p => activeCodes.includes(p.status)).length;
  const archivedCount = prescriptions.filter(p => archivedCodes.includes(p.status)).length;

  return (
    <AppLayout title={`Dzień dobry, ${user?.firstName ?? ''}`} subtitle="Oto Twoje podsumowanie">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 sm:mb-8">
        <StatCard to="/recepty/aktywne" icon={<FileCheck size={19} />} count={isLoading ? '–' : activeCount} label="Aktywne recepty" />
        <StatCard to="/recepty/archiwalne" icon={<Archive size={19} />} count={isLoading ? '–' : archivedCount} label="Archiwalne recepty" />
        <Link
          to="/apteki"
          className="hidden lg:flex bg-white rounded-2xl border border-neutral-200 p-5 items-center gap-4 hover:border-neutral-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 bg-brand-600 rounded-xl flex items-center justify-center shrink-0 text-white">
            <MapPin size={19} />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 leading-tight">Znajdź aptekę</p>
            <p className="text-xs text-neutral-500 mt-0.5">Wyszukaj w pobliżu</p>
          </div>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Najnowsze recepty</h2>
          <Link to="/recepty/aktywne" className="flex items-center gap-1 text-sm text-brand-700 font-medium hover:underline">
            Zobacz wszystkie <ChevronRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-14"><Spinner size="lg" /></div>
        ) : recent.length === 0 ? (
          <EmptyState title="Brak recept" description="Nie masz jeszcze żadnych recept w systemie." icon={<FileText size={44} />} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
