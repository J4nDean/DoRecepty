import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Search } from 'lucide-react';

interface Pharmacy {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

const MapPlaceholder = () => {
  const [city, setCity] = useState('');
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  const searchPharmacies = () => {
    axios.get(`http://localhost:8080/api/pharmacies/search?city=${city}`)
      .then(res => setPharmacies(res.data))
      .catch(() => {
        // Mock
        setPharmacies([
          { name: "Apteka Słoneczna", address: "ul. Prosta 1", city: "Warszawa", latitude: 52.2, longitude: 21.0 },
          { name: "Apteka Zdrowie", address: "ul. Miła 5", city: "Warszawa", latitude: 52.3, longitude: 21.1 }
        ].filter(p => p.city.toLowerCase().includes(city.toLowerCase())));
      });
  };

  useEffect(() => {
    searchPharmacies();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-4xl h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Wpisz miasto (np. Warszawa)..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchPharmacies()}
          />
        </div>
        <button 
          onClick={searchPharmacies}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Szukaj
        </button>
      </div>

      <div className="flex-1 bg-blue-50 rounded-lg relative overflow-hidden min-h-[400px] border border-blue-100">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#2563eb 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }}></div>
        
        {pharmacies.map((p, idx) => (
          <div 
            key={idx} 
            className="absolute flex flex-col items-center group cursor-pointer"
            style={{ 
              left: `${30 + (idx * 20)}%`, 
              top: `${40 + (idx * 15)}%` 
            }}
          >
            <div className="bg-white px-2 py-1 rounded shadow-lg text-xs font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {p.name}
            </div>
            <MapPin className="text-red-500 fill-red-200" size={32} />
          </div>
        ))}

        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur p-2 rounded text-[10px] text-gray-500">
          Mapa aptek (Placeholder)
        </div>
      </div>
    </div>
  );
};

export default MapPlaceholder;
