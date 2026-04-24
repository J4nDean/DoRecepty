import { useState, useCallback } from 'react';
import axios from 'axios';
import { Search, MapPin, Navigation, Loader2 } from 'lucide-react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
import '../styles/PharmacyMap.css';

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
  if (map && center) {
    map.panTo(center);
  }
  return null;
};

const PharmacyMap = () => {
  const [addressInput, setAddressInput] = useState<string>('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>({ lat: 52.237, lng: 21.017 });
  const [userMarker, setUserMarker] = useState<LatLngLiteral | null>(null);
  const [zoom] = useState<number>(11);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const geocodeBatch = useCallback(async (list: Pharmacy[]) => {
    if (typeof google === 'undefined') return;
    const geocoder = new google.maps.Geocoder();
    
    const missing = list.filter(p => !p.latitude).slice(0, 8);
    if (missing.length === 0) return;

    setIsGeocoding(true);

    const promises = missing.map((p) => {
      const fullAddress = `${p.address}, ${p.city}, Poland`;
      return new Promise<void>((resolve) => {
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
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
    if (!addressInput.trim()) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: addressInput }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const location = results[0].geometry.location;
        const newPos = { lat: location.lat(), lng: location.lng() };
        setMapCenter(newPos);
        setUserMarker(newPos);
      }
    });

    try {
      const res = await axios.get<Pharmacy[]>(`http://localhost:8080/api/pharmacies/search?city=${addressInput}`);
      const data = res.data;
      setPharmacies(data);
      setTimeout(() => geocodeBatch(data), 800);
    } catch (error) {
      console.error("Search error:", error);
    }
  }, [addressInput, geocodeBatch]);

  const onMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      const pos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
      setUserMarker(pos);
      setMapCenter(pos);
    }
  };

  return (
    <div className="map-container">
      <div className="search-header">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Wpisz miasto (np. Poznań)..." 
            className="search-input"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="search-button">
          {isGeocoding && <Loader2 size={18} className="animate-spin" />}
          Szukaj
        </button>
      </div>

      <div className="content-layout">
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>
              <MapPin size={18} className="text-blue-500" /> 
              Wyniki ({pharmacies.length})
            </h3>
          </div>
          <div className="results-list">
            {pharmacies.length > 0 ? (
              pharmacies.map((p, idx) => (
                <div 
                  key={idx} 
                  className="pharmacy-card"
                  onClick={() => p.latitude && setMapCenter({ lat: p.latitude, lng: p.longitude })}
                >
                  <p className="pharmacy-name">{p.name}</p>
                  <p className="pharmacy-address">{p.address}, {p.city}</p>
                  
                  {p.latitude ? (
                    <div className="show-on-map">
                      <Navigation size={10} /> Pokaż na mapie
                    </div>
                  ) : (
                    <div className="locating-badge">
                      <Loader2 size={10} className="animate-spin" /> Lokalizowanie...
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state">
                Wyszukaj miasto, aby zobaczyć apteki.
              </div>
            )}
          </div>
        </div>

        <div className="map-view-wrapper">
          {API_KEY ? (
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={zoom}
                gestureHandling="greedy"
                disableDefaultUI={false}
                onClick={onMapClick}
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
            <div className="empty-state">
              Brak klucza API Google Maps.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyMap;
