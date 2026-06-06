import axios from 'axios';
import type {
  Prescription, PrescriptionStatus, DrugRealizationStatus,
  Pharmacy, AppMetadata,
  ApiPrescription, ApiPharmacy, ApiPharmacyAvailability,
} from './types';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'https://finder-e-prescription-production.up.railway.app/api';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('rx_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

const noCache = () => ({ params: { _t: Date.now() }, headers: { 'Cache-Control': 'no-cache' } });

export default api;

interface AuthResponse {
  id: number; firstName: string; lastName: string;
  email: string; pesel: string; role?: string; token: string;
}

export const loginRequest = (email: string, password: string) =>
  api.post<AuthResponse>('/auth/login', { email, password }).then(r => r.data);

export const registerRequest = (data: {
  firstName: string; lastName: string; email: string; pesel: string; password: string;
}) => api.post<AuthResponse>('/auth/register', data).then(r => r.data);

export const changePassword = (userId: string, currentPassword: string, newPassword: string) =>
  api.put(`/users/${userId}/password`, { currentPassword, newPassword }).then(() => undefined);

export const fetchMetadata = (): Promise<AppMetadata> =>
  api.get<AppMetadata>('/prescriptions/metadata').then(r => r.data);

const STATUS_MAP: Record<string, PrescriptionStatus> = {
  ACTIVE: 'AKTYWNA',
  REALIZED: 'ZREALIZOWANA',
  PARTIALLY_REALIZED: 'CZĘŚCIOWO_ZREALIZOWANA',
  CANCELLED: 'ANULOWANA',
  ARCHIVED: 'ARCHIWALNA',
  AKTYWNA: 'AKTYWNA',
  ZREALIZOWANA: 'ZREALIZOWANA',
  CZĘŚCIOWO_ZREALIZOWANA: 'CZĘŚCIOWO_ZREALIZOWANA',
  NIEZREALIZOWANA: 'NIEZREALIZOWANA',
  ARCHIWALNA: 'ARCHIWALNA',
  ANULOWANA: 'ANULOWANA',
};

const ITEM_STATUS_MAP: Record<string, DrugRealizationStatus> = {
  ACTIVE: 'NIEZREALIZOWANY',
  REALIZED: 'ZREALIZOWANY',
  PARTIALLY_REALIZED: 'CZĘŚCIOWO',
  CANCELLED: 'NIEZREALIZOWANY',
};

const mapPrescription = (p: ApiPrescription): Prescription => ({
  id: String(p.id),
  number: p.accessCode,
  issueDate: p.issueDate ?? '',
  expiryDate: p.expirationDate ?? '',
  status: STATUS_MAP[p.status] ?? 'ARCHIWALNA',
  doctorName: 'Lekarz prowadzący',
  doctorSpecialty: 'Medycyna ogólna',
  doctorNpwz: p.doctorNpwz ?? '',
  clinicRegon: p.clinicRegon ?? '',
  patientPesel: p.patient?.pesel ?? '',
  drugs: (p.items ?? []).map(item => ({
    id: String(item.id),
    name: item.medication.name,
    dosage: [item.medication.strength, item.dosageInstructions].filter(Boolean).join(' · '),
    quantity: item.quantity ?? 1,
    unit: 'op.',
    realizationStatus: ITEM_STATUS_MAP[item.status] ?? 'NIEZREALIZOWANY',
    oid: item.prescriptionOid ?? '',
  })),
});

export const fetchPrescriptions = async (): Promise<Prescription[]> => {
  const res = await api.get<ApiPrescription[]>('/prescriptions/me', noCache());
  return res.data.map(mapPrescription);
};

export const fetchPrescriptionById = async (id: string): Promise<Prescription | undefined> => {
  try {
    const res = await api.get<ApiPrescription>(`/prescriptions/detail/${id}`, noCache());
    return mapPrescription(res.data);
  } catch {
    return undefined;
  }
};

export const fetchPharmaciesForPrescription = async (prescriptionId: string): Promise<Pharmacy[]> => {
  const res = await api.get<ApiPharmacyAvailability[]>(`/prescriptions/${prescriptionId}/pharmacies`, noCache());
  return res.data.map(p => ({
    id: String(p.id),
    name: p.name,
    address: p.address,
    city: p.city,
    postalCode: p.postalCode ?? '',
    phone: p.phone ?? '',
    openingHours: {
      weekdays: p.openingHoursWeekdays ?? null,
      saturday: p.openingHoursSaturday ?? null,
      sunday: p.openingHoursSunday ?? null,
    },
    isOpen: p.status ? p.status === 'AKTYWNA' : true,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    hasPrescriptionMedications: true,
    availableMedications: p.availableMedications.map(m => ({
      medicationId: String(m.medicationId),
      medicationName: m.medicationName,
      isAvailable: m.stockQuantity > 0,
      quantityInStock: m.stockQuantity,
      status: m.stockQuantity > 5 ? 'DOSTĘPNY' : m.stockQuantity > 0 ? 'CZĘŚCIOWO_DOSTĘPNY' : 'NIEDOSTĘPNY',
    })),
  }));
};

type Bounds = { north: number; south: number; east: number; west: number };

const HOURS_RE = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/;
const ALWAYS_OPEN_RE = /całodobowo|całą dobę|całodobow[ae]|24\s*h\b|00:00\s*[-–]\s*24:00/i;

const todaysHours = (p: ApiPharmacy): string | null | undefined => {
  const day = new Date().getDay();
  if (day === 0) return p.openingHoursSunday;
  if (day === 6) return p.openingHoursSaturday;
  return p.openingHoursWeekdays;
};

const isOpenNow = (p: ApiPharmacy): boolean => {
  if (p.status && p.status !== 'AKTYWNA') return false;
  const allHours = [p.openingHoursWeekdays, p.openingHoursSaturday, p.openingHoursSunday];
  if (allHours.some(h => h && ALWAYS_OPEN_RE.test(h))) return true;
  const match = todaysHours(p)?.match(HOURS_RE);
  if (!match) return false;
  const open = +match[1] * 60 + +match[2];
  const close = +match[3] * 60 + +match[4];
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  return now >= open && now < close;
};

const mapPharmacy = (p: ApiPharmacy): Pharmacy => ({
  id: String(p.id),
  name: p.name,
  address: p.address,
  city: p.city,
  postalCode: p.postalCode ?? '',
  phone: p.phone ?? '',
  openingHours: {
    weekdays: p.openingHoursWeekdays ?? null,
    saturday: p.openingHoursSaturday ?? null,
    sunday: p.openingHoursSunday ?? null,
  },
  isOpen: isOpenNow(p),
  latitude: p.latitude ?? undefined,
  longitude: p.longitude ?? undefined,
});

export const searchPharmacies = async (query: string, page = 0, size = 1000): Promise<Pharmacy[]> => {
  try {
    const res = await api.get<ApiPharmacy[]>('/pharmacies/search', { params: { query, page, size } });
    return res.data.map(mapPharmacy);
  } catch {
    return [];
  }
};

export const fetchNearbyByLocation = async (
  lat: number, lng: number, radiusKm = 10, limit = 20,
): Promise<Pharmacy[]> => {
  const res = await api.get<ApiPharmacy[]>('/pharmacies/nearby', { params: { lat, lng, radiusKm, limit } });
  return res.data.map(mapPharmacy);
};

export const fetchPharmaciesInBounds = async (bounds: Bounds): Promise<Pharmacy[]> => {
  const res = await api.get<ApiPharmacy[]>('/pharmacies/in-bounds', { params: bounds });
  return res.data.map(mapPharmacy);
};

export const updatePharmacyLocation = (
  name: string, address: string, city: string, latitude: number, longitude: number,
): Promise<void> =>
  api.post('/pharmacies/update-location', { name, address, city, latitude, longitude })
    .then(() => undefined)
    .catch(() => undefined);

// --- Panel administratora (WF-11, WF-12) ---

export type PharmacyInput = {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  status?: string;
  openingHoursWeekdays?: string;
  openingHoursSaturday?: string;
  openingHoursSunday?: string;
};

export const fetchAdminPharmacies = (): Promise<ApiPharmacy[]> =>
  api.get<ApiPharmacy[]>('/admin/pharmacies', noCache()).then(r => r.data);

export const createPharmacy = (data: PharmacyInput): Promise<ApiPharmacy> =>
  api.post<ApiPharmacy>('/admin/pharmacies', data).then(r => r.data);

export const updatePharmacy = (id: number, data: PharmacyInput): Promise<ApiPharmacy> =>
  api.put<ApiPharmacy>(`/admin/pharmacies/${id}`, data).then(r => r.data);

// --- Panel administratora — recepty ---

export interface AdminPrescription {
  id: number;
  accessCode: string;
  issueDate: string | null;
  expirationDate: string | null;
  status: string;
  patientPesel: string | null;
  patientName: string | null;
  patientId: number | null;
  items: AdminPrescriptionItem[];
}

export interface AdminPrescriptionItem {
  id: number;
  medicationId: number;
  medicationName: string;
  strength: string | null;
  quantity: number | null;
  dosageInstructions: string | null;
  status: string;
}

export interface AdminUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
}

export interface AdminMedication {
  id: number;
  name: string;
  strength: string | null;
  pharmaceuticalForm: string | null;
}

export const fetchAdminPrescriptions = (): Promise<AdminPrescription[]> =>
  api.get<AdminPrescription[]>('/admin/prescriptions', noCache()).then(r => r.data);

export const createAdminPrescription = (data: {
  patientId: number;
  accessCode: string;
  issueDate: string;
  expirationDate: string;
  doctorNpwz?: string;
  clinicRegon?: string;
  status: string;
  items: { medicationId: number; quantity: number; dosageInstructions?: string }[];
}): Promise<AdminPrescription> =>
  api.post<AdminPrescription>('/admin/prescriptions', data).then(r => r.data);

export const updateAdminPrescriptionStatus = (id: number, status: string): Promise<AdminPrescription> =>
  api.put<AdminPrescription>(`/admin/prescriptions/${id}/status`, { status }).then(r => r.data);

export const fetchAdminUsers = (): Promise<AdminUser[]> =>
  api.get<AdminUser[]>('/admin/users', noCache()).then(r => r.data);

export const searchAdminMedications = (q: string): Promise<AdminMedication[]> =>
  api.get<AdminMedication[]>('/admin/medications', { params: { q } }).then(r => r.data);

export const getUserLocation = (): Promise<{ lat: number; lng: number }> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Przeglądarka nie wspiera geolokalizacji'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });

export const fetchFavorites = (userId: string): Promise<string[]> =>
  api.get<number[]>(`/users/${userId}/favorites`, noCache()).then(r => r.data.map(String));

export const addFavorite = (userId: string, pharmacyId: string): Promise<void> =>
  api.post(`/users/${userId}/favorites/${pharmacyId}`).then(() => undefined);

export const removeFavorite = (userId: string, pharmacyId: string): Promise<void> =>
  api.delete(`/users/${userId}/favorites/${pharmacyId}`).then(() => undefined);

const CITY_PRIORITY_TYPES = [
  'locality', 'postal_town', 'administrative_area_level_3',
  'sublocality_level_1', 'administrative_area_level_2',
] as const;

const getGeocoder = () =>
  typeof window !== 'undefined' && window.google?.maps?.Geocoder
    ? new window.google.maps.Geocoder()
    : null;

export const reverseGeocode = (lat: number, lng: number): Promise<string | null> =>
  new Promise(resolve => {
    const geocoder = getGeocoder();
    if (!geocoder) return resolve(null);
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.length) return resolve(null);
      for (const type of CITY_PRIORITY_TYPES) {
        for (const result of results) {
          const found = result.address_components?.find(c => c.types.includes(type));
          if (found) return resolve(found.long_name);
        }
      }
      resolve(null);
    });
  });
