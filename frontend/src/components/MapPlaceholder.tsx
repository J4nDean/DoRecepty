import { Map } from 'lucide-react';

interface MapPlaceholderProps {
  className?: string;
  message?: string;
}

const MapPlaceholder = ({ className = '', message }: MapPlaceholderProps) => (
  <div
    className={`bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400 border border-slate-200 ${className}`}
    role="img"
    aria-label="Mapa aptek"
  >
    <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center mb-3">
      <Map size={26} className="text-slate-400" />
    </div>
    <p className="text-sm font-medium text-slate-500">
      {message ?? 'Mapa aptek'}
    </p>
    <p className="text-xs text-slate-400 mt-0.5">Integracja z Google Maps</p>
  </div>
);

export default MapPlaceholder;
