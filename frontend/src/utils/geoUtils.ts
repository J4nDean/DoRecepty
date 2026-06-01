export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

/** Odległość w km między dwoma punktami (wzór Haversine'a). */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

/** Sformatowana etykieta odległości — metry < 1 km, w przeciwnym razie km. */
export const distanceLabel = (km: number): string =>
  km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(km < 10 ? 2 : 1)} km`;
