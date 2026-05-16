type LatLng = { lat: number; lng: number };

const CITY_PRIORITY_TYPES = [
  'locality',
  'postal_town',
  'administrative_area_level_3',
  'sublocality_level_1',
  'administrative_area_level_2',
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

export const geocodeAddress = (address: string): Promise<LatLng | null> =>
  new Promise(resolve => {
    const geocoder = getGeocoder();
    if (!geocoder) return resolve(null);

    geocoder.geocode({ address }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) return resolve(null);
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
