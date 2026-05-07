import axios from 'axios';
import type { Prescription, Drug, PrescriptionStatus, DrugRealizationStatus } from '../types/prescription';
import type { ApiRecipe, ApiDrug } from '../types/api';
import { mockPrescriptions } from '../data/mockPrescriptions';
import { API_BASE_URL } from '../config/api';

/* ---- helpers ---- */

const STATUS_MAP: Record<string, PrescriptionStatus> = {
  AKTYWNA: 'AKTYWNA',
  ZREALIZOWANA: 'ZREALIZOWANA',
  CZĘŚCIOWO_ZREALIZOWANA: 'CZĘŚCIOWO_ZREALIZOWANA',
  ARCHIWALNA: 'ARCHIWALNA',
  ANULOWANA: 'ANULOWANA',
};

function parseQuantityStr(raw: string): { quantity: number; unit: string } {
  const match = raw.match(/^(\d+)\s*(.*)$/);
  if (match) {
    return { quantity: parseInt(match[1], 10), unit: match[2].trim() || 'szt.' };
  }
  return { quantity: 1, unit: raw };
}

function drugRealizationStatus(recipeStatus: string): DrugRealizationStatus {
  if (recipeStatus === 'ZREALIZOWANA' || recipeStatus === 'ARCHIWALNA') return 'ZREALIZOWANY';
  if (recipeStatus === 'CZĘŚCIOWO_ZREALIZOWANA') return 'CZĘŚCIOWO';
  return 'NIEZREALIZOWANY';
}

function mapDrug(apiDrug: ApiDrug, index: number, recipeStatus: string): Drug {
  const { quantity, unit } = parseQuantityStr(apiDrug.quantity);
  return {
    id: `d${index}`,
    name: apiDrug.name,
    dosage: '',
    quantity,
    unit,
    realizationStatus: drugRealizationStatus(recipeStatus),
  };
}

function mapRecipe(recipe: ApiRecipe, index: number): Prescription {
  const status: PrescriptionStatus = STATUS_MAP[recipe.status] ?? 'ARCHIWALNA';

  // Generate plausible dates since backend doesn't provide them
  const today = new Date();
  const issued = new Date(today);
  issued.setDate(today.getDate() - 7 * (index + 1));
  const expires = new Date(issued);
  expires.setDate(issued.getDate() + 30);

  return {
    id: recipe.accessCode,
    number: recipe.accessCode,
    issueDate: issued.toISOString().split('T')[0],
    expiryDate: expires.toISOString().split('T')[0],
    status,
    doctorName: 'Lekarz prowadzący',
    doctorSpecialty: 'Medycyna ogólna',
    patientPesel: recipe.pesel,
    drugs: recipe.drugs.map((d, i) => mapDrug(d, i, recipe.status)),
  };
}

/* ---- public API ---- */

export const fetchPrescriptions = async (pesel: string): Promise<Prescription[]> => {
  try {
    const res = await axios.get<ApiRecipe[]>(`${API_BASE_URL}/recipes/${pesel}`);
    return res.data.map(mapRecipe);
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
