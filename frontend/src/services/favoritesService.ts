import apiClient, { noCache } from './apiClient';

export const fetchFavorites = async (userId: string): Promise<string[]> => {
  const res = await apiClient.get<number[]>(`/users/${userId}/favorites`, noCache());
  return res.data.map(String);
};

export const addFavorite = async (userId: string, pharmacyId: string): Promise<void> => {
  await apiClient.post(`/users/${userId}/favorites/${pharmacyId}`);
};

export const removeFavorite = async (userId: string, pharmacyId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}/favorites/${pharmacyId}`);
};
