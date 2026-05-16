/* Thin wrapper around window.google.maps.Geocoder so non-Map components can
   geocode without having a Google Map instance. The Geocoder is loaded by
   PharmacyMapView's APIProvider — calling these helpers before the map mounts
   resolves to null. */

type LatLng = { lat: number; lng: number };

// Reverse-geocodes a lat/lng to the nearest city/town name. Google's response shape varies:
// some places return `locality`, others only `administrative_area_level_3` (gmina) or
// `sublocality`. We scan all results across a prioritised list of component types.
export const reverseGeocode = (lat: number, lng: number): Promise<string | null> =>
  new Promise(resolve => {
    if (!window.google?.maps?.Geocoder) { resolve(null); return; }
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== 'OK' || !results || results.length === 0) { resolve(null); return; }
      const priorityTypes = [
        'locality',
        'postal_town',
        'administrative_area_level_3',
        'sublocality_level_1',
        'administrative_area_level_2',
      ];
      for (const type of priorityTypes) {
        for (const result of results) {
          const found = result.address_components?.find(c => c.types.includes(type));
          if (found) { resolve(found.long_name); return; }
        }
      }
      resolve(null);
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
