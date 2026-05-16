import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  FileX,
} from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import PharmacyMapView from '../../components/PharmacyMapView';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { fetchPrescriptionById } from '../../services/prescriptionService';
import { fetchNearbyPharmacies } from '../../services/pharmacyService';
import { formatDate, formatDateShort } from '../../utils/formatDate';
import { statusLabel, statusColor } from '../../utils/prescriptionUtils';
import type { Prescription, DrugRealizationStatus } from '../../types/prescription';
import type { Pharmacy, DrugAvailabilityStatus } from '../../types/pharmacy';

const realizationConfig: Record<
  DrugRealizationStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  ZREALIZOWANY: {
    label: 'Zrealizowany',
    cls: 'bg-emerald-100 text-emerald-700',
    icon: <CheckCircle2 size={11} />,
  },
  NIEZREALIZOWANY: {
    label: 'Niezrealizowany',
    cls: 'bg-slate-100 text-slate-600',
    icon: <Clock size={11} />,
  },
  CZĘŚCIOWO: {
    label: 'Częściowo',
    cls: 'bg-amber-100 text-amber-700',
    icon: <XCircle size={11} />,
  },
};

const RealizationBadge = ({ status }: { status: DrugRealizationStatus }) => {
  const cfg = realizationConfig[status];
  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const availConfig: Record<DrugAvailabilityStatus, { label: string; cls: string }> = {
  DOSTĘPNY: { label: '✓ Dostępny', cls: 'bg-emerald-100 text-emerald-700' },
  CZĘŚCIOWO_DOSTĘPNY: { label: '~ Częściowo', cls: 'bg-amber-100 text-amber-700' },
  NIEDOSTĘPNY: { label: '✕ Brak', cls: 'bg-red-100 text-red-600' },
};

const PharmacyAvailabilityCard = ({
  pharmacy,
  prescription,
}: {
  pharmacy: Pharmacy;
  prescription: Prescription;
}) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{pharmacy.name}</p>
        <p className="text-xs text-slate-400 truncate">
          {pharmacy.address}, {pharmacy.city}
        </p>
      </div>
      <span
        className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          pharmacy.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {pharmacy.isOpen ? 'Otwarte' : 'Zamknięte'}
      </span>
    </div>

    {pharmacy.distance != null && (
      <p className="text-xs text-blue-600 font-medium mb-2.5">
        {pharmacy.distance < 1
          ? `${(pharmacy.distance * 1000).toFixed(0)} m`
          : `${pharmacy.distance.toFixed(1)} km`}{' '}
        od Ciebie
      </p>
    )}

    {prescription.drugs.length > 0 && (
      <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
        {prescription.drugs.map(drug => {
          const avail = pharmacy.availableDrugs?.find(a => a.drugId === drug.id);
          return (
            <div key={drug.id} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 truncate">{drug.name}</span>
              {avail ? (
                <span
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${availConfig[avail.status].cls}`}
                >
                  {availConfig[avail.status].label}
                </span>
              ) : (
                <span className="text-xs text-slate-300 shrink-0">—</span>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const PrescriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || !user?.pesel) return;
    Promise.all([
      fetchPrescriptionById(id, user.pesel),
      fetchNearbyPharmacies('Warszawa'),
    ])
      .then(([p, ph]) => {
        if (!p) setNotFound(true);
        else setPrescription(p);
        setPharmacies(ph);
      })
      .finally(() => setIsLoading(false));
  }, [id, user?.pesel]);

  if (isLoading) {
    return (
      <AppLayout title="Szczegóły recepty">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !prescription) {
    return (
      <AppLayout title="Szczegóły recepty">
        <div className="flex flex-col items-center py-20 gap-4">
          <FileX size={44} className="text-slate-300" />
          <p className="text-slate-500 text-sm">Nie znaleziono recepty.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            Wróć
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Szczegóły recepty" subtitle={`Nr ${prescription.number}`}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Wróć do listy recept
      </button>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                  Numer recepty
                </p>
                <p className="font-mono text-base font-bold text-slate-900">
                  {prescription.number}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[prescription.status]}`}
              >
                {statusLabel[prescription.status]}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Lekarz wystawiający</p>
                  <p className="font-semibold text-slate-800 text-sm">{prescription.doctorName}</p>
                  <p className="text-xs text-slate-400">{prescription.doctorSpecialty}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Data wystawienia</p>
                  <p className="font-semibold text-slate-800 text-sm">
                    {formatDate(prescription.issueDate)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Ważna do: {formatDateShort(prescription.expiryDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Pill size={16} className="text-blue-500" />
              Leki na recepcie ({prescription.drugs.length})
            </h2>
            <div className="divide-y divide-slate-50">
              {prescription.drugs.map(drug => (
                <div
                  key={drug.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{drug.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drug.dosage ? `${drug.dosage} · ` : ''}
                      {drug.quantity} {drug.unit}
                    </p>
                  </div>
                  <RealizationBadge status={drug.realizationStatus} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" />
              Mapa pobliskich aptek
            </h2>
            <PharmacyMapView
              pharmacies={pharmacies}
              selectedId={selectedPharmacyId}
              onSelect={id => setSelectedPharmacyId(prev => (prev === id ? null : id))}
              className="h-52"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            Dostępność leków w aptekach
          </h2>
          <div className="space-y-3">
            {pharmacies.map(p => (
              <PharmacyAvailabilityCard key={p.id} pharmacy={p} prescription={prescription} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PrescriptionDetailPage;
