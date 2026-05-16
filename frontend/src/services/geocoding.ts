/* Thin wrapper around window.google.maps.Geocoder so non-Map components can
   geocode without having a Google Map instance. The Geocoder is loaded by
   PharmacyMapView's APIProvider — calling these helpers before the map mounts
   resolves to null. */

type LatLng = { lat: number; lng: number };

export const reverseGeocode = (lat: number, lng: number): Promise<string | null> =>
  new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) { resolve(null); return; }
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) { resolve(null); return; }
      const city = results[0].address_components?.find(c => c.types.includes('locality'))?.long_name ?? null;
      resolve(city);
    });
  });

export const geocodeAddress = (address: string): Promise<LatLng | null> =>
  new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) {
      resolve(null);
      return;
    }
    new window.google.maps.Geocoder().geocode({ address }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
