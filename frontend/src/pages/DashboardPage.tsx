import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Archive, MapPin, ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { PrescriptionCard } from '../components/PrescriptionCard';
import { Spinner, EmptyState } from '../components/ui';
import { useAuth } from '../AuthContext';
import { useMetadata } from '../MetadataContext';
import { fetchPrescriptions } from '../api';
import { isExpiringSoon, daysUntilExpiry } from '../utils';
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
    className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4 hover:border-neutral-300 hover:shadow-sm transition-all shadow-sm h-24"
  >
    <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-neutral-900 leading-tight tracking-tight">{count}</p>
      <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{label}</p>
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

  const expiringSoon = prescriptions
    .filter(p => isExpiringSoon(p.status, p.expiryDate))
    .sort((a, b) => daysUntilExpiry(a.expiryDate!) - daysUntilExpiry(b.expiryDate!));

  const recent = [...prescriptions]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);
    
  const activeCount = prescriptions.filter(p => activeCodes.includes(p.status)).length;
  const archivedCount = prescriptions.filter(p => archivedCodes.includes(p.status)).length;

  return (
    <AppLayout title={`Dzień dobry, ${user?.firstName ?? ''}`} subtitle="Oto Twoje podsumowanie">
      <div className="space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard to="/recepty/aktywne" icon={<FileCheck size={20} />} count={isLoading ? '–' : activeCount} label="Aktywne" />
          <StatCard to="/recepty/archiwalne" icon={<Archive size={20} />} count={isLoading ? '–' : archivedCount} label="Archiwalne" />
          <Link
            to="/apteki"
            className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center gap-4 hover:border-neutral-300 hover:shadow-sm transition-all shadow-sm h-24"
          >
            <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm">
              <MapPin size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-900 leading-tight truncate">Znajdź aptekę</p>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Wyszukaj w pobliżu</p>
            </div>
          </Link>
        </div>

        {!isLoading && expiringSoon.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-sm" />
              <h2 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Ważne terminy</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {expiringSoon.map(p => {
                const days = daysUntilExpiry(p.expiryDate!);
                return (
                  <Link
                    key={p.id}
                    to={`/recepty/${p.id}`}
                    className="group relative overflow-hidden bg-white border border-neutral-200 rounded-lg h-24 p-5 flex items-center gap-4 shadow-sm hover:border-neutral-300 transition-all"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                    <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                      <AlertTriangle size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-black text-neutral-900 leading-tight">
                        Recepta wygaśnie {days === 0 ? 'dzisiaj' : days === 1 ? 'jutro' : `za ${days} dni`}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 truncate">
                        Nr recepty #{p.number}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-sm" />
              <h2 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Najnowsze dokumenty</h2>
            </div>
            <Link to="/recepty/aktywne" className="flex items-center gap-1.5 text-[11px] font-black text-brand-600 uppercase tracking-widest hover:underline">
              Zobacz wszystkie <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-14"><Spinner size="lg" /></div>
          ) : recent.length === 0 ? (
            <EmptyState title="Brak recept" description="Nie masz jeszcze żadnych recept w systemie." icon={<FileText size={44} />} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {recent.map(p => <PrescriptionCard key={p.id} prescription={p} />)}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
