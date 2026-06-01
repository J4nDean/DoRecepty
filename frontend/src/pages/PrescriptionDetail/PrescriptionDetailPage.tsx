import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, User, Pill,
  CheckCircle2, XCircle, Clock,
  MapPin, FileX, AlertTriangle,
} from 'lucide-react';
import { AppLayout } from '../../layouts/AppLayout';
import PharmacyMapView from '../../components/PharmacyMapView';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchPrescriptionById,
  fetchPharmaciesForPrescription,
} from '../../services/prescriptionService';
import { getUserLocation } from '../../services/pharmacyService';
import { formatDate, formatDateShort } from '../../utils/formatDate';
import { statusColor } from '../../utils/prescriptionUtils';
import { daysUntilExpiry, expiryWarningText, isExpiringSoon } from '../../utils/dateUtils';
import { haversineKm, distanceLabel, type LatLng } from '../../utils/geoUtils';
import { useMetadata } from '../../context/MetadataContext';
import type { Prescription, DrugRealizationStatus } from '../../types/prescription';
import type { Pharmacy, MedicationAvailabilityStatus } from '../../types/pharmacy';

// Tylko styling — etykiety przychodzą z backend metadata.
const realizationStyle: Record<DrugRealizationStatus, { cls: string; icon: React.ReactNode }> = {
  ZREALIZOWANY:    { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} /> },
  NIEZREALIZOWANY: { cls: 'bg-slate-100 text-slate-600',     icon: <Clock size={11} /> },
  CZĘŚCIOWO:       { cls: 'bg-amber-100 text-amber-700',     icon: <XCircle size={11} /> },
};

const availabilityStyle: Record<MedicationAvailabilityStatus, string> = {
  DOSTĘPNY:           'bg-emerald-100 text-emerald-700',
  CZĘŚCIOWO_DOSTĘPNY: 'bg-amber-100 text-amber-700',
  NIEDOSTĘPNY:        'bg-red-100 text-red-600',
};

const RealizationBadge = ({ status, label }: { status: DrugRealizationStatus; label: string }) => {
  const { cls, icon } = realizationStyle[status];
  return (
    <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${cls}`}>
      {icon}
      {label}
    </span>
  );
};

const IconBox = ({ icon }: { icon: React.ReactNode }) => (
  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
    {icon}
  </div>
);

const ExpiryInfo = ({ status, expiryDate }: { status: string; expiryDate: string }) => {
  if (!isExpiringSoon(status, expiryDate)) {
    return <p className="text-xs text-slate-400">Ważna do: {formatDateShort(expiryDate)}</p>;
  }
  const days = daysUntilExpiry(expiryDate);
  return (
    <div className="mt-1">
      <p className="text-xs text-amber-700 font-semibold">
        Ważna do: {formatDateShort(expiryDate)}
      </p>
      <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 mt-0.5">
        <AlertTriangle size={11} />
        {expiryWarningText(days)}
      </p>
    </div>
  );
};

const PharmacyAvailabilityCard = ({
  pharmacy, prescription, selected, onClick, availabilityLabel,
}: {
  pharmacy: Pharmacy;
  prescription: Prescription;
  selected: boolean;
  onClick: () => void;
  availabilityLabel: (status: MedicationAvailabilityStatus) => string;
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all ${
      selected
        ? 'border-blue-500 ring-1 ring-blue-100 shadow-md'
        : 'border-slate-100 hover:border-blue-300 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between gap-2 mb-1.5">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate">{pharmacy.name}</p>
        <p className="text-xs text-slate-400 truncate">
          {pharmacy.address}, {pharmacy.city}
        </p>
      </div>
      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        pharmacy.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {pharmacy.isOpen ? 'Otwarte' : 'Zamknięte'}
      </span>
    </div>

    {pharmacy.distance != null && (
      <p className="text-xs text-blue-600 font-medium mb-2.5">
        {distanceLabel(pharmacy.distance)} od Ciebie
      </p>
    )}

    {prescription.drugs.length > 0 && (
      <div className="space-y-1.5 border-t border-slate-50 pt-2.5">
        {prescription.drugs.map(drug => {
          const avail  = pharmacy.availableMedications?.find(a => a.medicationName === drug.name);
          const status = avail?.status ?? 'NIEDOSTĘPNY';
          return (
            <div key={drug.id} className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-600 truncate">{drug.name}</span>
              <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${availabilityStyle[status]}`}>
                {availabilityLabel(status)}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const withDistance = (pharmacies: Pharmacy[], loc: LatLng | null): Pharmacy[] => {
  if (!loc) return pharmacies;
  return pharmacies
    .map(p =>
      p.latitude != null && p.longitude != null
        ? { ...p, distance: haversineKm(loc, { lat: p.latitude, lng: p.longitude }) }
        : p,
    )
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
};

const withAvailability = (pharmacies: Pharmacy[], drugCount: number): Pharmacy[] =>
  pharmacies.map(p => {
    const have = p.availableMedications?.filter(m => m.isAvailable).length ?? 0;
    return {
      ...p,
      prescriptionAvailability: have >= drugCount && drugCount > 0 ? 'FULL' : 'PARTIAL',
    };
  });

const PrescriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { metadata, labelOf } = useMetadata();

  const [prescription, setPrescription]               = useState<Prescription | null>(null);
  const [pharmacies, setPharmacies]                   = useState<Pharmacy[]>([]);
  const [userLocation, setUserLocation]               = useState<LatLng | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId]   = useState<string | null>(null);
  const [isLoading, setIsLoading]                     = useState(true);
  const [notFound, setNotFound]                       = useState(false);

  const availabilityLabel = (status: MedicationAvailabilityStatus) =>
    labelOf(metadata.medicationAvailabilityStatuses, status);
  const realizationLabel = (status: DrugRealizationStatus) =>
    labelOf(metadata.drugRealizationStatuses, status);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchPrescriptionById(id), fetchPharmaciesForPrescription(id)])
      .then(([p, ph]) => {
        if (!p) setNotFound(true);
        else setPrescription(p);
        setPharmacies(ph);
      })
      .finally(() => setIsLoading(false));

    getUserLocation().then(setUserLocation).catch(() => setUserLocation(null));
  }, [id]);

  const pharmaciesWithDistance = withDistance(
    withAvailability(pharmacies, prescription?.drugs.length ?? 0),
    userLocation,
  );

  const togglePharmacy = (pid: string) =>
    setSelectedPharmacyId(prev => (prev === pid ? null : pid));

  if (isLoading) {
    return (
      <AppLayout title="Szczegóły recepty">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
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
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 sm:mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Wróć do listy recept
      </button>

      <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-3 space-y-4 sm:space-y-5">
          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                  Numer recepty
                </p>
                <p className="font-mono text-base font-bold text-slate-900 break-all">
                  {prescription.number}
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[prescription.status]}`}>
                {labelOf(metadata.prescriptionStatuses, prescription.status)}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="flex items-start gap-3">
                <IconBox icon={<User size={15} className="text-blue-600" />} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Lekarz wystawiający</p>
                  <p className="font-semibold text-slate-800 text-sm truncate">{prescription.doctorName}</p>
                  <p className="text-xs text-slate-400 truncate">{prescription.doctorSpecialty}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <IconBox icon={<Calendar size={15} className="text-blue-600" />} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 mb-0.5">Data wystawienia</p>
                  <p className="font-semibold text-slate-800 text-sm">
                    {formatDate(prescription.issueDate)}
                  </p>
                  <ExpiryInfo status={prescription.status} expiryDate={prescription.expiryDate} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Pill size={16} className="text-blue-500" />
              Leki na recepcie ({prescription.drugs.length})
            </h2>
            <div className="divide-y divide-slate-50">
              {prescription.drugs.map(drug => (
                <div key={drug.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{drug.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {drug.dosage ? `${drug.dosage} · ` : ''}
                      {drug.quantity} {drug.unit}
                    </p>
                  </div>
                  <RealizationBadge
                    status={drug.realizationStatus}
                    label={realizationLabel(drug.realizationStatus)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" />
              Apteki z lekami z recepty
            </h2>
            <PharmacyMapView
              pharmacies={pharmaciesWithDistance}
              selectedId={selectedPharmacyId}
              onSelect={togglePharmacy}
              userLocation={userLocation}
              defaultZoom={15}
              className="h-72 sm:h-[28rem] md:h-[32rem] rounded-lg"
            />
            {!userLocation && (
              <p className="text-[11px] text-slate-400 mt-2">
                Udostępnij lokalizację, aby zobaczyć odległości do aptek.
              </p>
            )}
          </section>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-blue-500" />
            Dostępność leków ({pharmaciesWithDistance.length})
          </h2>
          {pharmaciesWithDistance.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-6 text-center text-sm text-slate-500">
              Żadna apteka nie ma obecnie na stanie leków z tej recepty.
            </div>
          ) : (
            <div className="space-y-3">
              {pharmaciesWithDistance.map(p => (
                <PharmacyAvailabilityCard
                  key={p.id}
                  pharmacy={p}
                  prescription={prescription}
                  selected={p.id === selectedPharmacyId}
                  onClick={() => togglePharmacy(p.id)}
                  availabilityLabel={availabilityLabel}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PrescriptionDetailPage;
