import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Pill,
  CheckCircle2, Clock, XCircle,
  MapPin, FileX, AlertTriangle, Navigation,
} from 'lucide-react';
import { AppLayout } from '../components/Layout';
import PharmacyMapView from '../components/PharmacyMapView';
import { Spinner } from '../components/ui';
import { openBadgeColor } from '../theme';
import { fetchPrescriptionById, fetchPharmaciesForPrescription, getUserLocation } from '../api';
import {
  formatDateShort, daysUntilExpiry, expiryWarningText, isExpiringSoon,
  withDistance, distanceLabel, statusMetaOf,
  drugFullName, drugFormLine, packageQuantityLabel, documentOid, type LatLng,
} from '../utils';
import { useMetadata } from '../MetadataContext';
import { useAuth } from '../AuthContext';
import type { Prescription, DrugRealizationStatus, Pharmacy, MedicationAvailabilityStatus } from '../types';

const realizationStyle: Record<DrugRealizationStatus, { cls: string; icon: React.ReactNode }> = {
  ZREALIZOWANY: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: <CheckCircle2 size={12} /> },
  NIEZREALIZOWANY: { cls: 'bg-neutral-100 text-neutral-600 ring-neutral-200', icon: <Clock size={12} /> },
  CZĘŚCIOWO: { cls: 'bg-brand-50 text-brand-700 ring-brand-200', icon: <XCircle size={12} /> },
};

const availabilityStyle: Record<MedicationAvailabilityStatus, string> = {
  DOSTĘPNY: 'bg-emerald-50 text-emerald-700',
  CZĘŚCIOWO_DOSTĘPNY: 'bg-brand-50 text-brand-700',
  NIEDOSTĘPNY: 'bg-rose-50 text-rose-600',
};

const RealizationBadge = ({ status, label }: { status: DrugRealizationStatus; label: string }) => {
  const { cls, icon } = realizationStyle[status];
  return (
    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ring-1 shrink-0 uppercase tracking-tighter sm:text-[11px] sm:gap-1.5 sm:px-3 whitespace-nowrap ${cls}`}>
      {icon}
      {label}
    </span>
  );
};

const ExpiryInfo = ({ status, expiryDate }: { status: string; expiryDate: string }) => {
  if (!isExpiringSoon(status, expiryDate)) {
    return <p className="text-sm text-neutral-400 font-medium">Ważna do: {formatDateShort(expiryDate)}</p>;
  }
  const days = daysUntilExpiry(expiryDate);
  return (
    <div className="mt-1">
      <p className="text-sm text-amber-700 font-bold">Ważna do: {formatDateShort(expiryDate)}</p>
      <p className="flex items-center gap-1.5 text-[12px] font-black text-amber-700 mt-1 uppercase">
        <AlertTriangle size={12} />
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
    className={`bg-white rounded-xl border shadow-sm p-5 cursor-pointer transition-all ${
      selected ? 'border-brand-600 shadow-md ring-2 ring-brand-600/10' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
    }`}
  >
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0">
        <p className="font-bold text-neutral-900 text-base truncate">{pharmacy.name}</p>
        <p className="text-sm text-neutral-400 truncate">{pharmacy.address}, {pharmacy.city}</p>
      </div>
      <span className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full ring-1 uppercase tracking-tighter ${openBadgeColor(pharmacy.isOpen)}`}>
        {pharmacy.isOpen ? 'Otwarte' : 'Zamknięte'}
      </span>
    </div>

    {pharmacy.distance != null && (
      <p className="text-sm text-brand-700 font-bold mb-3">{distanceLabel(pharmacy.distance)} od Ciebie</p>
    )}

    {prescription.drugs.length > 0 && (
      <div className="space-y-2 border-t border-neutral-100 pt-3">
        {prescription.drugs.map(drug => {
          const avail = pharmacy.availableMedications?.find(a => a.medicationName === drug.name);
          const status = avail?.status ?? 'NIEDOSTĘPNY';
          return (
            <div key={drug.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-neutral-700 font-medium truncate">{drug.name}</span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shrink-0 ${availabilityStyle[status]}`}>
                {availabilityLabel(status)}
              </span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

const buildDirectionsUrl = (pharmacy: Pharmacy, origin: LatLng | null): string => {
  const destination = pharmacy.latitude != null && pharmacy.longitude != null
    ? `${pharmacy.latitude},${pharmacy.longitude}`
    : [pharmacy.address, pharmacy.postalCode, pharmacy.city].filter(Boolean).join(', ');
  const params = new URLSearchParams({ api: '1', destination, travelmode: 'driving' });
  if (origin) params.set('origin', `${origin.lat},${origin.lng}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

const withAvailability = (pharmacies: Pharmacy[], drugCount: number): Pharmacy[] =>
  pharmacies.map(p => {
    const have = p.availableMedications?.filter(m => m.isAvailable).length ?? 0;
    return { ...p, prescriptionAvailability: have >= drugCount && drugCount > 0 ? 'FULL' : 'PARTIAL' };
  });

const BarcodeMock = ({ number }: { number: string }) => {
  const fullBarcodeNumber = `100101723${number}316993141033672942435380593264361040`.slice(0, 44);
  return (
    <div className="flex flex-col items-center w-full">
      <div
        aria-hidden
        className="h-12 sm:h-16 w-full max-w-[440px] opacity-40"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #000 0, #000 2px, transparent 2px, transparent 4px, #000 4px, #000 7px, transparent 7px, transparent 9px, #000 9px, #000 10px, transparent 10px, transparent 13px)',
        }}
      />
      <p className="max-w-full text-[8px] sm:text-[12px] text-neutral-700 font-mono font-bold tracking-[0.12em] sm:tracking-[0.25em] mt-1.5 leading-none text-center break-all">
        {fullBarcodeNumber}
      </p>
    </div>
  );
};

const PrescriptionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { metadata, labelOf } = useMetadata();
  const { user } = useAuth();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
    true,
  );

  const togglePharmacy = (pid: string) => setSelectedPharmacyId(prev => (prev === pid ? null : pid));

  const selectedPharmacy = pharmaciesWithDistance.find(p => p.id === selectedPharmacyId) ?? null;

  if (isLoading) {
    return (
      <AppLayout title="E-recepta">
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </AppLayout>
    );
  }

  if (notFound || !prescription) {
    return (
      <AppLayout title="E-recepta">
        <div className="flex flex-col items-center py-20 gap-4">
          <FileX size={44} className="text-neutral-300" />
          <p className="text-neutral-500 text-sm">Nie znaleziono recepty.</p>
          <button onClick={() => navigate(-1)} className="text-brand-700 text-sm font-medium hover:underline">Wróć</button>
        </div>
      </AppLayout>
    );
  }

  const statusMeta = statusMetaOf(prescription.status);
  const expiringSoon = isExpiringSoon(prescription.status, prescription.expiryDate);

  return (
    <AppLayout title="E-recepta" subtitle={`Dokument nr ${prescription.number}`}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-base text-neutral-500 hover:text-brand-700 mb-6 sm:mb-8 transition-colors font-semibold"
      >
        <ArrowLeft size={18} />
        Wróć do listy recept
      </button>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-4">
          <section className={`bg-white rounded-lg border shadow-sm overflow-hidden w-full transition-all ${
            expiringSoon ? 'border-amber-400 ring-2 ring-amber-400' : 'border-neutral-200'
          }`}>
            <div className="p-4 sm:p-8 border-b border-dashed border-neutral-200 bg-neutral-50/20 flex flex-col items-center">
              <BarcodeMock number={prescription.number} />
              <p className="text-center text-[8px] sm:text-[10px] text-neutral-500 font-mono font-bold mt-2 tracking-[0.15em] sm:tracking-[0.25em] uppercase opacity-70 break-all">
                ID: {documentOid(prescription.number)}
              </p>
            </div>

            <div className="p-4 sm:p-10 space-y-5 sm:space-y-8">
              <div className="flex flex-col gap-5 sm:gap-8 md:flex-row md:items-start md:justify-between">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase font-black tracking-widest mb-2 sm:mb-3">Kod dostępu</p>
                    <div className="relative px-7 py-3.5 sm:px-10 sm:py-4 bg-white shadow-inner rounded">
                      <div className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-l-2 border-brand-600" />
                      <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-t-2 border-r-2 border-brand-600" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-l-2 border-brand-600" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 border-b-2 border-r-2 border-brand-600" />
                      <span className="text-4xl sm:text-5xl font-mono font-black text-neutral-900 tracking-widest tabular-nums">{prescription.number}</span>
                    </div>
                  </div>
                  <div className="h-16 w-px bg-neutral-100 hidden sm:block mx-2 sm:mx-4" />
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase font-black tracking-widest mb-1">Wystawiono</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900">{formatDateShort(prescription.issueDate)}</p>
                    <ExpiryInfo status={prescription.status} expiryDate={prescription.expiryDate} />
                  </div>
                </div>

                <div className="flex justify-center md:block shrink-0">
                  <span className={`inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 rounded-full ring-2 ${statusMeta.chip} uppercase tracking-tight shadow-sm max-w-full`}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusMeta.dot}`} />
                    <span className="truncate">{labelOf(metadata.prescriptionStatuses, prescription.status)}</span>
                  </span>
                </div>
              </div>

              <div className="pt-6 sm:pt-8 border-t border-neutral-100 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase font-black tracking-widest mb-1.5 sm:mb-2.5">Pacjent</p>
                  <p className="text-sm sm:text-base font-black text-neutral-900 leading-tight">
                    {user ? `${user.firstName} ${user.lastName}` : '—'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-bold mt-1">PESEL: {prescription.patientPesel || '—'}</p>
                </div>
                <div className="sm:border-l sm:border-neutral-100 sm:pl-6">
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 uppercase font-black tracking-widest mb-1.5 sm:mb-2.5">Wystawca</p>
                  <p className="text-sm sm:text-base font-black text-neutral-900 leading-tight">{prescription.doctorName}</p>
                  <p className="text-[10px] sm:text-xs text-neutral-500 font-bold mt-1">PWZ lekarza: {prescription.doctorNpwz || '—'}</p>
                  <p className="text-[9px] sm:text-[10px] text-neutral-400 font-medium uppercase mt-0.5">REGON podmiotu: {prescription.clinicRegon || '—'}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 w-full">
            <div className="flex items-center justify-between px-2 mb-2">
              <h2 className="text-sm sm:text-base font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                <Pill size={18} className="text-brand-600 sm:w-5 sm:h-5" />
                Pozycje leków ({prescription.drugs.length})
              </h2>
            </div>
            <div className="space-y-3">
              {prescription.drugs.map((drug, i) => (
                <div key={drug.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden w-full">
                  <div className="bg-neutral-50/50 px-4 sm:px-5 py-2 border-b border-neutral-100 flex justify-between items-center">
                    <span className="text-[10px] sm:text-[11px] font-black text-neutral-500 uppercase tracking-wider">Pozycja {i + 1} z {prescription.drugs.length}</span>
                    <span className="font-mono text-[9px] sm:text-[10px] text-neutral-400 font-bold truncate ml-2">REF: {drug.oid || `000-P1-${prescription.number}`}</span>
                  </div>
                  <div className="p-5 sm:p-8 flex flex-col sm:flex-row justify-between gap-6 sm:gap-8">
                    <div className="min-w-0 space-y-4 flex-1">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-neutral-900 leading-tight uppercase tracking-tight">{drugFullName(drug)}</h3>
                        {drug.commonName && (
                          <p className="text-[11px] sm:text-xs text-neutral-500 mt-1 font-bold italic">{drug.commonName}</p>
                        )}
                        {drugFormLine(drug) && (
                          <p className="text-[11px] sm:text-xs text-neutral-400 font-semibold uppercase tracking-wide mt-0.5">{drugFormLine(drug)}</p>
                        )}
                        <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 sm:mt-2 font-bold">
                          Data realizacji: od {formatDateShort(drug.realizationDateFrom ?? prescription.issueDate)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                          <p className="text-sm sm:text-base text-neutral-700 font-black">{packageQuantityLabel(drug)}</p>
                          <p className="text-sm sm:text-base font-black text-neutral-700">
                            Odpłatność: <span className="text-brand-700">{drug.refundLevel}</span>
                          </p>
                        </div>
                        <div className="inline-block bg-brand-50 border border-brand-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base text-brand-900 font-black shadow-sm max-w-full">
                          <span className="opacity-50 text-[10px] uppercase block mb-0.5">Dawkowanie (D.S.):</span>
                          {drug.dosage || 'wg zaleceń lekarza'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-neutral-100 pt-4 sm:pt-0 sm:pl-10 min-w-0 sm:min-w-[140px]">
                      <div className="flex gap-6 sm:gap-8 sm:mb-6 order-2 sm:order-1">
                        <div className="text-2xl sm:text-3xl font-black text-neutral-200 opacity-60">R</div>
                        <div className="text-2xl sm:text-3xl font-black text-brand-600">S</div>
                      </div>
                      <div className="order-1 sm:order-2">
                        <RealizationBadge status={drug.realizationStatus} label={realizationLabel(drug.realizationStatus)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 sm:p-8 w-full">
            <h2 className="text-base font-black text-neutral-800 mb-6 flex items-center gap-2 uppercase tracking-widest text-center sm:text-left">
              <MapPin size={20} className="text-brand-600" />
              Lokalizacja dostępności
            </h2>
            <PharmacyMapView
              pharmacies={pharmaciesWithDistance}
              selectedId={selectedPharmacyId}
              onSelect={togglePharmacy}
              userLocation={userLocation}
              defaultZoom={15}
              className="h-[26rem] sm:h-[34rem] lg:h-[38rem] rounded-lg border border-neutral-100 shadow-inner"
            />

            {selectedPharmacy ? (
              <a
                href={buildDirectionsUrl(selectedPharmacy, userLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-black uppercase tracking-wide text-sm sm:text-base px-5 py-3.5 rounded-lg shadow-sm transition-colors"
              >
                <Navigation size={18} className="shrink-0" />
                Nawiguj
              </a>
            ) : (
              <p className="mt-4 w-full flex items-center justify-center gap-2 bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 font-bold text-sm px-5 py-3.5 rounded-lg text-center">
                <MapPin size={16} className="shrink-0" />
                Zaznacz aptekę na mapie, aby wyznaczyć trasę
              </p>
            )}
          </section>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-base font-black text-neutral-800 mb-6 flex items-center gap-2 px-2 uppercase tracking-widest">
            <MapPin size={20} className="text-brand-600" />
            Apteki w pobliżu ({pharmaciesWithDistance.length})
          </h2>
          {pharmaciesWithDistance.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-500 font-medium">
              Brak danych o dostępności w Twojej okolicy.
            </div>
          ) : (
            <div className="space-y-4">
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
