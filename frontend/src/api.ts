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

api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';
    const isAuthCall = url.includes('/auth/');
    if ((status === 401 || status === 403) && !isAuthCall && localStorage.getItem('rx_token')) {
      localStorage.removeItem('rx_token');
      localStorage.removeItem('rx_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

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

const PRESCRIPTION_STATUSES: readonly PrescriptionStatus[] = [
  'AKTYWNA', 'CZĘŚCIOWO_ZREALIZOWANA', 'NIEZREALIZOWANA', 'ZREALIZOWANA', 'ARCHIWALNA', 'ANULOWANA',
];
const ITEM_STATUSES: readonly DrugRealizationStatus[] = [
  'NIEZREALIZOWANY', 'ZREALIZOWANY', 'CZĘŚCIOWO',
];

const asPrescriptionStatus = (s: string): PrescriptionStatus =>
  (PRESCRIPTION_STATUSES as readonly string[]).includes(s) ? (s as PrescriptionStatus) : 'ARCHIWALNA';
const asItemStatus = (s: string): DrugRealizationStatus =>
  (ITEM_STATUSES as readonly string[]).includes(s) ? (s as DrugRealizationStatus) : 'NIEZREALIZOWANY';

const normalizeRefundLevel = (level: string | null): string => {
  if (!level) return '100%';
  return level.toLowerCase() === 'ryczalt' ? 'ryczałt' : level;
};

const mapPrescription = (p: ApiPrescription): Prescription => ({
  id: String(p.id),
  number: p.accessCode,
  issueDate: p.issueDate ?? '',
  expiryDate: p.expirationDate ?? '',
  status: asPrescriptionStatus(p.status),
  doctorName: 'lek. (uprawniony do wystawiania recept)',
  doctorSpecialty: 'Medycyna ogólna',
  doctorNpwz: p.doctorNpwz ?? '',
  clinicRegon: p.clinicRegon ?? '',
  patientPesel: p.patient?.pesel ?? '',
  drugs: (p.items ?? []).map(item => ({
    id: String(item.id),
    name: item.medication.name,
    commonName: item.medication.commonName ?? undefined,
    strength: item.medication.strength ?? undefined,
    form: item.medication.pharmaceuticalForm ?? undefined,
    packageSize: item.medication.packageSize ?? undefined,
    dosage: item.dosageInstructions ?? '',
    quantity: item.quantity ?? 1,
    unit: 'op.',
    refundLevel: normalizeRefundLevel(item.refundLevel),
    realizationDateFrom: item.realizationDateFrom ?? undefined,
    realizationStatus: asItemStatus(item.status),
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

export const archivePrescription = async (prescriptionId: string): Promise<void> => {
  await api.patch(`/prescriptions/${prescriptionId}/archive`);
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
      status: m.stockQuantity > 0 ? 'DOSTĘPNY' : 'NIEDOSTĘPNY',
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
  if (p.status && p.status.toUpperCase() !== 'AKTYWNA') return false;
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

export const fetchPharmaciesInBounds = async (bounds: Bounds): Promise<Pharmacy[]> => {
  const res = await api.get<ApiPharmacy[]>('/pharmacies/in-bounds', { params: bounds });
  return res.data.map(mapPharmacy);
};

export const approxBounds = (lat: number, lng: number, radiusKm = 12): Bounds => {
  const latD = radiusKm / 111.0;
  const lngD = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return { north: lat + latD, south: lat - latD, east: lng + lngD, west: lng - lngD };
};

export const updatePharmacyLocation = (
  name: string, address: string, city: string, latitude: number, longitude: number,
): Promise<void> =>
  api.post('/pharmacies/update-location', { name, address, city, latitude, longitude })
    .then(() => undefined)
    .catch(() => undefined);

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
