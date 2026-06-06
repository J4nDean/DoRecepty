import type { Drug, PrescriptionStatus } from './types';

// "Laroaks 2,5 mg" — nazwa handlowa z mocą, jak w nagłówku pozycji recepty P1.
export const drugFullName = (d: Drug): string =>
  [d.name, d.strength].filter(Boolean).join(' ');

// "Tabletki powlekane · 28 tabl." — postać i wielkość opakowania.
export const drugFormLine = (d: Drug): string =>
  [d.form, d.packageSize].filter(Boolean).join(' · ');

// "1 op. po 28 tabl." — liczba opakowań i ich wielkość, jak na wydruku P1.
export const packageQuantityLabel = (d: Drug): string =>
  `${d.quantity} op.${d.packageSize ? ` po ${d.packageSize}` : ''}`;

// Identyfikator dokumentu w stylu OID systemu P1 (jak "ID: 2.19.840.1.113993...").
export const documentOid = (accessCode: string): string =>
  `2.19.840.1.113993.3.4424.2.7.${accessCode}.1`;

export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateShort = (dateStr: string): string =>
  parseLocalDate(dateStr).toLocaleDateString('pl-PL');

export const daysUntilExpiry = (expiryDate: string): number => {
  const expiry = parseLocalDate(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
};

export const isExpiringSoon = (status: string, expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  if (status !== 'AKTYWNA' && status !== 'CZĘŚCIOWO_ZREALIZOWANA' && status !== 'NIEZREALIZOWANA') return false;
  const d = daysUntilExpiry(expiryDate);
  return d >= 0 && d <= 7;
};

export const expiryWarningText = (days: number): string =>
  days === 0 ? 'Wygasa dzisiaj' :
  days === 1 ? 'Wygasa jutro' :
  `Wygasa za ${days} dni`;

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export const haversineKm = (a: LatLng, b: LatLng): number => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

export const distanceLabel = (km: number): string =>
  km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`;

export interface StatusMeta {
  dot: string;
  chip: string;
  rail: string;
}

export const STATUS_META: Record<PrescriptionStatus, StatusMeta> = {
  AKTYWNA:                { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', rail: 'bg-emerald-500' },
  CZĘŚCIOWO_ZREALIZOWANA: { dot: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 ring-amber-200',       rail: 'bg-amber-400' },
  NIEZREALIZOWANA:        { dot: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-700 ring-rose-200',          rail: 'bg-rose-500' },
  ZREALIZOWANA:           { dot: 'bg-zinc-400',    chip: 'bg-zinc-100 text-zinc-600 ring-zinc-200',         rail: 'bg-zinc-300' },
  ARCHIWALNA:             { dot: 'bg-zinc-400',    chip: 'bg-zinc-100 text-zinc-500 ring-zinc-200',         rail: 'bg-zinc-300' },
  ANULOWANA:              { dot: 'bg-rose-500',    chip: 'bg-rose-50 text-rose-600 ring-rose-200',          rail: 'bg-rose-400' },
};

export const statusMetaOf = (status: string): StatusMeta =>
  STATUS_META[status as PrescriptionStatus] ?? STATUS_META.ARCHIWALNA;
