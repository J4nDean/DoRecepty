import { useEffect, useState } from 'react';
import { FileCheck } from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import { PrescriptionCard } from '../../components/PrescriptionCard';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { fetchPrescriptions } from '../../services/prescriptionService';
import type { Prescription } from '../../types/prescription';

interface SectionProps {
  dot: string;
  label: string;
  count: number;
  prescriptions: Prescription[];
}

const Section = ({ dot, label, count, prescriptions }: SectionProps) => (
  <section>
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label} ({count})
      </h2>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {prescriptions.map(p => (
        <PrescriptionCard key={p.id} prescription={p} />
      ))}
    </div>
  </section>
);

const ActivePrescriptionsPage = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.pesel) return;
    fetchPrescriptions(user.pesel)
      .then(data =>
        setPrescriptions(
          data.filter(p => ['AKTYWNA', 'CZĘŚCIOWO_ZREALIZOWANA'].includes(p.status)),
        ),
      )
      .finally(() => setIsLoading(false));
  }, [user?.pesel]);

  const active = prescriptions.filter(p => p.status === 'AKTYWNA');
  const partial = prescriptions.filter(p => p.status === 'CZĘŚCIOWO_ZREALIZOWANA');

  return (
    <AppLayout title="Aktywne e-recepty" subtitle="Recepty wymagające realizacji">
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : prescriptions.length === 0 ? (
        <EmptyState
          title="Brak aktywnych recept"
          description="Wszystkie Twoje recepty zostały zrealizowane lub wygasły."
          icon={<FileCheck size={44} />}
        />
      ) : (
        <div className="space-y-10">
          {active.length > 0 && (
            <Section
              dot="bg-emerald-500"
              label="Aktywne"
              count={active.length}
              prescriptions={active}
            />
          )}
          {partial.length > 0 && (
            <Section
              dot="bg-amber-400"
              label="Częściowo zrealizowane"
              count={partial.length}
              prescriptions={partial}
            />
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default ActivePrescriptionsPage;
