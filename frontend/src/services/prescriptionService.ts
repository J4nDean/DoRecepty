import type { Prescription, PrescriptionStatus, DrugRealizationStatus } from '../types/prescription';
import type { Pharmacy } from '../types/pharmacy';
import type { ApiPrescription, ApiPharmacyAvailability } from '../types/api';
import apiClient, { noCache } from './apiClient';

const STATUS_MAP: Record<string, PrescriptionStatus> = {
  ACTIVE:                'AKTYWNA',
  REALIZED:              'ZREALIZOWANA',
  PARTIALLY_REALIZED:    'CZĘŚCIOWO_ZREALIZOWANA',
  CANCELLED:             'ANULOWANA',
  ARCHIVED:              'ARCHIWALNA',
  AKTYWNA:               'AKTYWNA',
  ZREALIZOWANA:          'ZREALIZOWANA',
  CZĘŚCIOWO_ZREALIZOWANA:'CZĘŚCIOWO_ZREALIZOWANA',
  ARCHIWALNA:            'ARCHIWALNA',
  ANULOWANA:             'ANULOWANA',
};

const ITEM_STATUS_MAP: Record<string, DrugRealizationStatus> = {
  ACTIVE:             'NIEZREALIZOWANY',
  REALIZED:           'ZREALIZOWANY',
  PARTIALLY_REALIZED: 'CZĘŚCIOWO',
  CANCELLED:          'NIEZREALIZOWANY',
};

function mapPrescription(p: ApiPrescription, pesel: string): Prescription {
  return {
    id: String(p.id),
    number: p.accessCode,
    issueDate: p.issueDate ?? '',
    expiryDate: p.expirationDate ?? '',
    status: STATUS_MAP[p.status] ?? 'ARCHIWALNA',
    doctorName: 'Lekarz prowadzący',
    doctorSpecialty: 'Medycyna ogólna',
    patientPesel: p.patient?.pesel ?? pesel,
    drugs: (p.items ?? []).map(item => ({
      id: String(item.id),
      name: item.medication.name,
      dosage: [item.medication.strength, item.dosageInstructions].filter(Boolean).join(' · '),
      quantity: item.quantity ?? 1,
      unit: 'op.',
      realizationStatus: ITEM_STATUS_MAP[item.status] ?? 'NIEZREALIZOWANY',
    })),
  };
}

export const fetchPrescriptions = async (): Promise<Prescription[]> => {
  const res = await apiClient.get<ApiPrescription[]>('/prescriptions/me', noCache());
  return res.data.map(p => mapPrescription(p, p.patient?.pesel ?? ''));
};

export const fetchPrescriptionById = async (id: string): Promise<Prescription | undefined> => {
  try {
    const res = await apiClient.get<ApiPrescription>(`/prescriptions/detail/${id}`, noCache());
    return mapPrescription(res.data, res.data.patient?.pesel ?? '');
  } catch {
    return undefined;
  }
};

export const fetchPharmaciesForPrescription = async (
  prescriptionId: string,
): Promise<Pharmacy[]> => {
  const res = await apiClient.get<ApiPharmacyAvailability[]>(
    `/prescriptions/${prescriptionId}/pharmacies`,
    noCache(),
  );
  return res.data.map(api => ({
    id: String(api.id),
    name: api.name,
    address: api.address,
    city: api.city,
    postalCode: api.postalCode ?? '',
    phone: api.phone ?? '',
    openingHours: {
      weekdays: api.openingHoursWeekdays || '08:00 – 20:00',
      saturday: api.openingHoursSaturday || '09:00 – 17:00',
      sunday:   api.openingHoursSunday   || '10:00 – 16:00',
    },
    isOpen: api.status ? api.status === 'AKTYWNA' : true,
    latitude:  api.latitude  ?? undefined,
    longitude: api.longitude ?? undefined,
    hasPrescriptionMedications: true,
    availableMedications: api.availableMedications.map(m => ({
      medicationId: String(m.medicationId),
      medicationName: m.medicationName,
      isAvailable: m.stockQuantity > 0,
      quantityInStock: m.stockQuantity,
      status: m.stockQuantity > 5 ? 'DOSTĘPNY' : m.stockQuantity > 0 ? 'CZĘŚCIOWO_DOSTĘPNY' : 'NIEDOSTĘPNY',
    })),
  }));
};
