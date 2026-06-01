import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMetadata } from './api';
import type { AppMetadata, EnumOption } from './types';

const EMPTY: AppMetadata = {
  prescriptionStatuses: [],
  drugRealizationStatuses: [],
  medicationAvailabilityStatuses: [],
};

interface MetadataContextValue {
  metadata: AppMetadata;
  loaded: boolean;
  /** Etykieta po polsku dla danego kodu — pusty string jeśli nie znaleziono. */
  labelOf: (list: EnumOption[], code: string) => string;
  /** Filtrowanie opcji statusu po kategorii (np. ACTIVE / ARCHIVED). */
  byCategory: (list: EnumOption[], category: string) => EnumOption[];
}

const MetadataContext = createContext<MetadataContextValue | undefined>(undefined);

export const MetadataProvider = ({ children }: { children: ReactNode }) => {
  const [metadata, setMetadata] = useState<AppMetadata>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchMetadata()
      .then(setMetadata)
      .catch(() => setMetadata(EMPTY))
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo<MetadataContextValue>(() => ({
    metadata,
    loaded,
    labelOf: (list, code) => list.find(o => o.code === code)?.label ?? '',
    byCategory: (list, category) => list.filter(o => o.category === category),
  }), [metadata, loaded]);

  return <MetadataContext.Provider value={value}>{children}</MetadataContext.Provider>;
};

export const useMetadata = (): MetadataContextValue => {
  const ctx = useContext(MetadataContext);
  if (!ctx) throw new Error('useMetadata must be used within MetadataProvider');
  return ctx;
};
