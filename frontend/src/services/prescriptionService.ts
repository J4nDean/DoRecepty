import axios from 'axios';
import type { Prescription, PrescriptionStatus } from '../types/prescription';
import type { ApiPrescription } from '../types/api';
import { mockPrescriptions } from '../data/mockPrescriptions';
import { API_BASE_URL } from '../config/api';

const STATUS_MAP: Record<string, PrescriptionStatus> = {
  // English statuses from backend
  ACTIVE: 'AKTYWNA',
  REALIZED: 'ZREALIZOWANA',
  PARTIALLY_REALIZED: 'CZĘŚCIOWO_ZREALIZOWANA',
  CANCELLED: 'ANULOWANA',
  ARCHIVED: 'ARCHIWALNA',
  // Polish statuses (fallback / future)
  AKTYWNA: 'AKTYWNA',
  ZREALIZOWANA: 'ZREALIZOWANA',
  CZĘŚCIOWO_ZREALIZOWANA: 'CZĘŚCIOWO_ZREALIZOWANA',
  ARCHIWALNA: 'ARCHIWALNA',
  ANULOWANA: 'ANULOWANA',
};

function mapPrescription(p: ApiPrescription, pesel: string): Prescription {
  return {
    id: p.id,
    number: p.accessCode,
    issueDate: p.issueDate ?? '',
    expiryDate: p.expirationDate ?? '',
    status: STATUS_MAP[p.status] ?? 'ARCHIWALNA',
    doctorName: 'Lekarz prowadzący',
    doctorSpecialty: 'Medycyna ogólna',
    patientPesel: p.patient?.pesel ?? pesel,
    drugs: [],
  };
}

export const fetchPrescriptions = async (pesel: string): Promise<Prescription[]> => {
  try {
    const res = await axios.get<ApiPrescription[]>(`${API_BASE_URL}/prescriptions/${pesel}`);
    return res.data.map(p => mapPrescription(p, pesel));
  } catch {
    return mockPrescriptions.filter(p => p.patientPesel === pesel);
  }
};

export const fetchPrescriptionById = async (
  id: string,
  pesel: string,
): Promise<Prescription | undefined> => {
  try {
    const all = await fetchPrescriptions(pesel);
    return all.find(p => p.id === id);
  } catch {
    return mockPrescriptions.find(p => p.id === id);
  }
};
