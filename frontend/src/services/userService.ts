import apiClient from './apiClient';

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  await apiClient.put(`/users/${userId}/password`, { currentPassword, newPassword });
};
