import axios from 'axios';
import type { Pharmacy } from '../types/pharmacy';
import type { ApiPharmacy } from '../types/api';
import { mockPharmacies } from '../data/mockPharmacies';
import { API_BASE_URL } from '../config/api';

/* ---- helpers ---- */

function parseOpeningHours(hoursStr: string | null | undefined): { open: number; close: number } | null {
  if (!hoursStr) return null;
  // Match first "HH:MM - HH:MM" pattern (supports - and – separators)
  const match = hoursStr.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const open = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const close = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
  return { open, close };
}

function isOpenNow(api: ApiPharmacy): boolean {
  if (api.status && api.status !== 'AKTYWNA') return false;

  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  let hoursStr: string | null | undefined;
  if (day === 0) hoursStr = api.openingHoursSunday;
  else if (day === 6) hoursStr = api.openingHoursSaturday;
  else hoursStr = api.openingHoursWeekdays;

  const hours = parseOpeningHours(hoursStr);
  if (!hours) return false;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= hours.open && nowMinutes < hours.close;
}

function mapApiPharmacy(api: ApiPharmacy): Pharmacy {
  return {
    id: String(api.id),
    name: api.name,
    address: api.address,
    city: api.city,
    postalCode: api.postalCode ?? '',
    phone: api.phone ?? '',
    openingHours: {
      weekdays: api.openingHoursWeekdays || '08:00 – 20:00',
      saturday: api.openingHoursSaturday || '09:00 – 17:00',
      sunday: api.openingHoursSunday || '10:00 – 16:00',
    },
    isOpen: isOpenNow(api),
    latitude: api.latitude ?? undefined,
    longitude: api.longitude ?? undefined,
  };
}

/* ---- public API ---- */

export const searchPharmacies = async (city: string): Promise<Pharmacy[]> => {
  try {
    const res = await axios.get<ApiPharmacy[]>(
      `${API_BASE_URL}/pharmacies/search?city=${encodeURIComponent(city)}`,
    );
    return res.data.map(mapApiPharmacy);
  } catch {
    return mockPharmacies;
  }
};

export const fetchNearbyPharmacies = async (city = 'Warszawa'): Promise<Pharmacy[]> => {
  return searchPharmacies(city);
};

export const fetchNearbyByLocation = async (
  lat: number,
  lng: number,
  radiusKm = 10,
  limit = 20,
): Promise<Pharmacy[]> => {
  const res = await axios.get<ApiPharmacy[]>(
    `${API_BASE_URL}/pharmacies/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&limit=${limit}`,
  );
  return res.data.map(mapApiPharmacy);
};

export const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Przeglądarka nie wspiera geolokalizacji'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
};

export const updatePharmacyLocation = async (
  name: string,
  address: string,
  city: string,
  latitude: number,
  longitude: number,
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/pharmacies/update-location`, {
      name,
      address,
      city,
      latitude,
      longitude,
    });
  } catch {
    /* silent — geocoding is best-effort */
  }
};
