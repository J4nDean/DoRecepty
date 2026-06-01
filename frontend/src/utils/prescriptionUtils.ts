/**
 * Mapowanie status → klasy CSS dla badge'a/etykiety.
 * Etykiety tekstowe i listy statusów są ładowane z backendu (MetadataContext).
 * Tu trzymamy tylko styling, który należy do warstwy prezentacji.
 */
export const statusColor: Record<string, string> = {
  AKTYWNA:                'bg-emerald-100 text-emerald-700',
  CZĘŚCIOWO_ZREALIZOWANA: 'bg-amber-100 text-amber-700',
  ZREALIZOWANA:           'bg-slate-100 text-slate-600',
  ARCHIWALNA:             'bg-slate-100 text-slate-500',
  ANULOWANA:              'bg-red-100 text-red-600',
};
