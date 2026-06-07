import { useEffect, useMemo, useState } from 'react';
import { fetchPrescriptions } from './api';
import { useMetadata } from './MetadataContext';
import type { Prescription } from './types';

export const usePrescriptions = (category: 'ACTIVE' | 'ARCHIVED') => {
  const { metadata, byCategory, loaded } = useMetadata();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const options = useMemo(
    () => byCategory(metadata.prescriptionStatuses, category),
    [metadata, byCategory, category],
  );

  const codes = useMemo(() => options.map(o => o.code), [options]);

  useEffect(() => {
    if (!loaded) return;
    fetchPrescriptions()
      .then(data => setPrescriptions(data.filter(p => codes.includes(p.status))))
      .catch(() => setPrescriptions([]))
      .finally(() => setIsLoading(false));
  }, [loaded, codes]);

  return { prescriptions, isLoading, options };
};
