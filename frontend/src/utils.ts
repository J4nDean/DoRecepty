// Drobne funkcje pomocnicze: daty, odległości oraz styl statusów recept.
import type { PrescriptionStatus } from './types';

// ---------- Daty ----------

/** Parsuje "YYYY-MM-DD" jako datę lokalną (bez przesunięcia strefy UTC). */
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDate = (dateStr: string): string =>
  parseLocalDate(dateStr).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatDateShort = (dateStr: string): string =>
  parseLocalDate(dateStr).toLocaleDateString('pl-PL');

/** Liczba dni do wygaśnięcia (ujemna = już po terminie). */
export const daysUntilExpiry = (expiryDate: string): number => {
  const expiry = parseLocalDate(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
};

/** Czy recepta jest aktywna i wygasa za ≤ 7 dni. */
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

// ---------- Geolokalizacja ----------

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Odległość w km między dwoma punktami (wzór Haversine'a). */
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

// ---------- Styl statusów recept ----------
// Etykiety tekstowe przychodzą z backendu (metadata); tu trzymamy tylko prezentację.

export interface StatusMeta {
  /** kolor kropki / akcentu */
  dot: string;
  /** klasy chipa statusu */
  chip: string;
  /** kolor lewego paska na karcie */
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
