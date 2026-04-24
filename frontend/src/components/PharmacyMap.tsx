import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import {
  APIProvider,
  Map,
  Marker,
  useMap
} from '@vis.gl/react-google-maps';

interface Pharmacy {
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}

type LatLngLiteral = {
  lat: number;
  lng: number;
};

const MapHandler = ({ center }: { center: LatLngLiteral }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);
  return null;
};

const PharmacyMap = () => {
  const [addressInput, setAddressInput] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>({ lat: 52.237, lng: 21.017 });
  const [userMarker, setUserMarker] = useState<LatLngLiteral | null>(null);
  const [zoom, setZoom] = useState(11);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const geocodeBatch = useCallback(async (list: Pharmacy[]) => {
    if (typeof google === 'undefined') return;
    const geocoder = new google.maps.Geocoder();
    
    // Optymalizacja: tylko 8 aptek na raz (bezpieczniej dla darmowych limitów)
    const missing = list.filter(p => !p.latitude).slice(0, 8);
    if (missing.length === 0) return;

    setIsGeocoding(true);

    const promises = missing.map((p) => {
      const fullAddress = `${p.address}, ${p.city}, Poland`;
      return new Promise<void>((resolve) => {
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            p.latitude = lat;
            p.longitude = lng;
            axios.post('http://localhost:8080/api/pharmacies/update-location', p).catch(() => {});
          }
          resolve();
        });
      });
    });

    await Promise.all(promises);
    setPharmacies([...list]);
    setIsGeocoding(false);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!addressInput) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addressInput }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newPos = { lat: location.lat(), lng: location.lng() };
        setMapCenter(newPos);
        setUserMarker(newPos);
        setZoom(13);
      }
    });

    try {
      const res = await axios.get(`http://localhost:8080/api/pharmacies/search?city=${addressInput}`);
      const data = res.data;
      setPharmacies(data);
      // Lokalizujemy z małym opóźnieniem, żeby nie blokować animacji mapy
      setTimeout(() => geocodeBatch(data), 800);
    } catch (error) {}
  }, [addressInput, geocodeBatch]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-6xl h-[700px] flex flex-col">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Wpisz miasto (np. Poznań)..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {isGeocoding && <Loader2 size={18} className="animate-spin" />}
          Szukaj
        </button>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="w-80 flex flex-col border border-gray-100 rounded-lg overflow-hidden bg-gray-50 text-black">
          <div className="p-4 bg-white border-b border-gray-100">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" /> 
              Wyniki ({pharmacies.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {pharmacies.length > 0 ? (
              pharmacies.map((p, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-3 rounded-lg shadow-sm border border-transparent hover:border-blue-300 cursor-pointer transition-all"
                  onClick={() => p.latitude && setMapCenter({ lat: p.latitude, lng: p.longitude })}
                >
                  <p className="font-bold text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{p.address}, {p.city}</p>
                  
                  {p.latitude ? (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600 font-semibold uppercase">
                      <Navigation size={10} /> Pokaż na mapie
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-orange-400 italic">
                      <Loader2 size={10} className="animate-spin" /> Lokalizowanie...
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-center p-4 text-gray-400 text-sm italic">
                Wyszukaj miasto, aby zobaczyć apteki.
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
          {API_KEY ? (
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={zoom}
                gestureHandling={'greedy'}
                disableDefaultUI={false}
                onClick={(e: any) => {
                  if (e.detail.latLng) {
                    const pos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
                    setUserMarker(pos);
                    setMapCenter(pos);
                  }
                }}
              >
                {userMarker && <Marker position={userMarker} />}
                {pharmacies.map((p, idx) => (
                  p.latitude && p.longitude && (
                    <Marker
                      key={idx}
                      position={{ lat: p.latitude, lng: p.longitude }}
                      title={p.name}
                      icon="http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    />
                  )
                ))}
                <MapHandler center={mapCenter} />
              </Map>
            </APIProvider>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <p>Brak klucza API Google Maps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPlaceholder;
