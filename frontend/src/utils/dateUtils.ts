/** Parsuje "YYYY-MM-DD" jako lokalną datę (uniknięcie offsetu UTC). */
export const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Liczba dni do daty wygaśnięcia (ujemna = już po terminie). */
export const daysUntilExpiry = (expiryDate: string): number => {
  const expiry = parseLocalDate(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
};

/** Czy recepta jest aktywna i wygasa za ≤ 7 dni. */
export const isExpiringSoon = (status: string, expiryDate?: string): boolean => {
  if (!expiryDate) return false;
  if (status !== 'AKTYWNA' && status !== 'CZĘŚCIOWO_ZREALIZOWANA') return false;
  const d = daysUntilExpiry(expiryDate);
  return d >= 0 && d <= 7;
};

/** Tekst ostrzeżenia o wygaśnięciu. */
export const expiryWarningText = (days: number): string =>
  days === 0 ? 'Wygasa dzisiaj!' :
  days === 1 ? 'Wygasa jutro!' :
  `Wygasa za ${days} dni`;
