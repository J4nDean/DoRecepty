import { MapPin, Phone, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Pharmacy } from '../types/pharmacy';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onClick?: () => void;
  selected?: boolean;
}

const distanceLabel = (km: number) =>
  km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;

export const PharmacyCard = ({
  pharmacy,
  onClick,
  selected = false,
}: PharmacyCardProps) => (
  <article
    onClick={onClick}
    className={`bg-white rounded-xl border p-4 transition-all ${
      onClick ? 'cursor-pointer' : ''
    } ${
      selected
        ? 'border-blue-400 shadow-md ring-1 ring-blue-100'
        : 'border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md'
    }`}
    aria-label={`${pharmacy.name}, ${pharmacy.isOpen ? 'otwarte' : 'zamknięte'}`}
  >
    {/* Name + status */}
    <div className="flex items-start justify-between gap-2 mb-2.5">
      <h3 className="font-semibold text-slate-800 text-sm leading-tight">{pharmacy.name}</h3>
      <span
        className={`shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          pharmacy.isOpen
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        {pharmacy.isOpen ? (
          <CheckCircle2 size={10} />
        ) : (
          <XCircle size={10} />
        )}
        {pharmacy.isOpen ? 'Otwarte' : 'Zamknięte'}
      </span>
    </div>

    {/* Details */}
    <div className="space-y-1 text-xs text-slate-500">
      <p className="flex items-center gap-1.5">
        <MapPin size={12} className="shrink-0 text-slate-400" />
        {pharmacy.address}, {pharmacy.city}
      </p>
      {pharmacy.distance != null && (
        <p className="flex items-center gap-1.5">
          <span className="w-3 h-3 inline-block" />
          <span className="text-blue-600 font-medium">
            {distanceLabel(pharmacy.distance)}
          </span>{' '}
          od Ciebie
        </p>
      )}
      <p className="flex items-center gap-1.5">
        <Clock size={12} className="shrink-0 text-slate-400" />
        Pn–Pt: {pharmacy.openingHours.weekdays}
      </p>
      {pharmacy.phone && (
        <p className="flex items-center gap-1.5">
          <Phone size={12} className="shrink-0 text-slate-400" />
          {pharmacy.phone}
        </p>
      )}
    </div>
  </article>
);
