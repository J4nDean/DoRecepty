import axios from 'axios';
import type { Pharmacy } from '../types/pharmacy';
import type { ApiPharmacy } from '../types/api';
import { mockPharmacies } from '../data/mockPharmacies';
import { API_BASE_URL } from '../config/api';

type HourRange = { open: number; close: number };
type Bounds = { north: number; south: number; east: number; west: number };

const HOURS_RE       = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/;
const ALWAYS_OPEN_RE = /całodobowo|całą dobę|całodobow[ae]|24\s*h\b|00:00\s*[-–]\s*24:00/i;
const MINUTES_PER_HOUR = 60;

function parseOpeningHours(hoursStr: string | null | undefined): HourRange | null {
  if (!hoursStr) return null;
  const match = hoursStr.match(HOURS_RE);
  if (!match) return null;
  const [, openH, openM, closeH, closeM] = match;
  return {
    open:  parseInt(openH, 10)  * MINUTES_PER_HOUR + parseInt(openM, 10),
    close: parseInt(closeH, 10) * MINUTES_PER_HOUR + parseInt(closeM, 10),
  };
}

function todaysHours(api: ApiPharmacy): string | null | undefined {
  const day = new Date().getDay();
  if (day === 0) return api.openingHoursSunday;
  if (day === 6) return api.openingHoursSaturday;
  return api.openingHoursWeekdays;
}

function isOpenNow(api: ApiPharmacy): boolean {
  if (api.status && api.status !== 'AKTYWNA') return false;

  const allHours = [api.openingHoursWeekdays, api.openingHoursSaturday, api.openingHoursSunday];
  if (allHours.some(h => h && ALWAYS_OPEN_RE.test(h))) return true;

  const hours = parseOpeningHours(todaysHours(api));
  if (!hours) return false;

  const now = new Date();
  const nowMinutes = now.getHours() * MINUTES_PER_HOUR + now.getMinutes();
  return nowMinutes >= hours.open && nowMinutes < hours.close;
}

function mapApiPharmacy(api: ApiPharmacy): Pharmacy {
  return {
    id:         String(api.id),
    name:       api.name,
    address:    api.address,
    city:       api.city,
    postalCode: api.postalCode ?? '',
    phone:      api.phone ?? '',
    openingHours: {
      weekdays: api.openingHoursWeekdays || '08:00 – 20:00',
      saturday: api.openingHoursSaturday || '09:00 – 17:00',
      sunday:   api.openingHoursSunday   || '10:00 – 16:00',
    },
    isOpen:    isOpenNow(api),
    latitude:  api.latitude  ?? undefined,
    longitude: api.longitude ?? undefined,
  };
}

async function getPharmacies(path: string): Promise<ApiPharmacy[]> {
  const res = await axios.get<ApiPharmacy[]>(`${API_BASE_URL}${path}`);
  return res.data;
}

export const searchPharmacies = async (city: string): Promise<Pharmacy[]> => {
  try {
    const data = await getPharmacies(`/pharmacies/search?city=${encodeURIComponent(city)}`);
    return data.map(mapApiPharmacy);
  } catch {
    return mockPharmacies;
  }
};

export const fetchNearbyPharmacies = (city = 'Warszawa'): Promise<Pharmacy[]> =>
  searchPharmacies(city);

export const fetchNearbyByLocation = async (
  lat: number,
  lng: number,
  radiusKm = 10,
  limit = 20,
): Promise<Pharmacy[]> => {
  const data = await getPharmacies(
    `/pharmacies/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&limit=${limit}`,
  );
  return data.map(mapApiPharmacy);
};

export const fetchPharmaciesInBounds = async (bounds: Bounds): Promise<Pharmacy[]> => {
  const { north, south, east, west } = bounds;
  const data = await getPharmacies(
    `/pharmacies/in-bounds?north=${north}&south=${south}&east=${east}&west=${west}`,
  );
  return data.map(mapApiPharmacy);
};

export const getUserLocation = (): Promise<{ lat: number; lng: number }> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Przeglądarka nie wspiera geolokalizacji'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });

export const updatePharmacyLocation = async (
  name: string,
  address: string,
  city: string,
  latitude: number,
  longitude: number,
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/pharmacies/update-location`, {
      name, address, city, latitude, longitude,
    });
  } catch (_) {
    void _;
  }
};
