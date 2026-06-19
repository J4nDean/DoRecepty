import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMetadata } from '../lib/api';
import type { AppMetadata, EnumOption } from '../types';

const EMPTY: AppMetadata = {
  prescriptionStatuses: [],
  drugRealizationStatuses: [],
  medicationAvailabilityStatuses: [],
};

interface MetadataContextValue {
  metadata: AppMetadata;
  loaded: boolean;
  labelOf: (list: EnumOption[], code: string) => string;
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
