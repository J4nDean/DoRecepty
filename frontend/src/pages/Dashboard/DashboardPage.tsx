import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Archive, MapPin, ChevronRight, FileText } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PrescriptionCard } from '../../components/PrescriptionCard';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchPrescriptions } from '../../services/prescriptionService';
import type { Prescription } from '../../types/prescription';


interface StatCardProps {
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  count: string | number;
  label: string;
}

const StatCard = ({ to, icon, iconBg, count, label }: StatCardProps) => (
  <Link
    to={to}
    className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all"
  >
    <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-slate-900 leading-tight">{count}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </Link>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.pesel) return;
    fetchPrescriptions(user.pesel)
      .then(data => setPrescriptions(data))
      .finally(() => setIsLoading(false));
  }, [user?.pesel]);

  const recent = prescriptions.slice(0, 3);
  const activeCount = prescriptions.filter(p =>
    ['AKTYWNA', 'CZĘŚCIOWO_ZREALIZOWANA'].includes(p.status),
  ).length;
  const archivedCount = prescriptions.filter(p =>
    ['ZREALIZOWANA', 'ARCHIWALNA', 'ANULOWANA'].includes(p.status),
  ).length;

  return (
    <AppLayout
      title={`Dzień dobry, ${user?.firstName ?? ''}!`}
      subtitle="Oto Twoje podsumowanie"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <StatCard
          to="/recepty/aktywne"
          icon={<FileCheck size={19} className="text-blue-600" />}
          iconBg="bg-blue-50"
          count={isLoading ? '–' : activeCount}
          label="Aktywne recepty"
        />
        <StatCard
          to="/recepty/archiwalne"
          icon={<Archive size={19} className="text-slate-500" />}
          iconBg="bg-slate-50"
          count={isLoading ? '–' : archivedCount}
          label="Archiwalne recepty"
        />
        <Link
          to="/apteki"
          className="hidden lg:flex bg-white rounded-xl border border-slate-100 shadow-sm p-5 items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <MapPin size={19} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-tight">Znajdź aptekę</p>
            <p className="text-xs text-slate-500 mt-0.5">Wyszukaj w pobliżu</p>
          </div>
        </Link>
      </div>

      {/* Recent prescriptions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Najnowsze recepty
          </h2>
          <Link
            to="/recepty/aktywne"
            className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
          >
            Zobacz wszystkie <ChevronRight size={15} />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-14">
            <Spinner size="lg" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            title="Brak recept"
            description="Nie masz jeszcze żadnych recept w systemie."
            icon={<FileText size={44} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map(p => (
              <PrescriptionCard key={p.id} prescription={p} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
