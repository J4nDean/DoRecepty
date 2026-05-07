import type { PrescriptionStatus } from '../types/prescription';

export const statusLabel: Record<PrescriptionStatus, string> = {
  AKTYWNA: 'Aktywna',
  CZĘŚCIOWO_ZREALIZOWANA: 'Częściowo zrealizowana',
  ZREALIZOWANA: 'Zrealizowana',
  ARCHIWALNA: 'Archiwalna',
  ANULOWANA: 'Anulowana',
};

export const statusColor: Record<PrescriptionStatus, string> = {
  AKTYWNA: 'bg-emerald-100 text-emerald-700',
  CZĘŚCIOWO_ZREALIZOWANA: 'bg-amber-100 text-amber-700',
  ZREALIZOWANA: 'bg-slate-100 text-slate-600',
  ARCHIWALNA: 'bg-slate-100 text-slate-500',
  ANULOWANA: 'bg-red-100 text-red-600',
};

export const statusDotColor: Record<PrescriptionStatus, string> = {
  AKTYWNA: 'bg-emerald-500',
  CZĘŚCIOWO_ZREALIZOWANA: 'bg-amber-400',
  ZREALIZOWANA: 'bg-slate-400',
  ARCHIWALNA: 'bg-slate-300',
  ANULOWANA: 'bg-red-400',
};
