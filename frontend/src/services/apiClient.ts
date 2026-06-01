import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('rx_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

/** Cache-bust params — dołącz do żądań GET które mogą być agresywnie cache'owane */
export const noCache = () => ({
  params: { _t: Date.now() },
  headers: { 'Cache-Control': 'no-cache' },
});

export default apiClient;
