import apiClient from './apiClient';
import type { AppMetadata } from '../types/metadata';

export const fetchMetadata = async (): Promise<AppMetadata> => {
  const res = await apiClient.get<AppMetadata>('/metadata');
  return res.data;
};
