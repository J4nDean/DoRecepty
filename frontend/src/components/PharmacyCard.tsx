import { forwardRef } from 'react';
import { MapPin, Phone, Clock, CheckCircle2, XCircle, Star } from 'lucide-react';
import type { Pharmacy } from '../types';
import { distanceLabel } from '../utils';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onClick?: () => void;
  selected?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const PharmacyCard = forwardRef<HTMLElement, PharmacyCardProps>(
  ({ pharmacy, onClick, selected = false, isFavorite = false, onToggleFavorite }, ref) => (
    <article
      ref={ref}
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 transition-all ${onClick ? 'cursor-pointer' : ''} ${
        selected
          ? 'border-brand-600 shadow-md'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
      }`}
      aria-label={`${pharmacy.name}, ${pharmacy.isOpen ? 'otwarte' : 'zamknięte'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <h3 className="font-semibold text-neutral-900 text-sm leading-tight flex-1 min-w-0">
          {pharmacy.name}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ring-1 ${
              pharmacy.isOpen
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-neutral-100 text-neutral-500 ring-neutral-200'
            }`}
          >
            {pharmacy.isOpen ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
            {pharmacy.isOpen ? 'Otwarte' : 'Zamknięte'}
          </span>
          {onToggleFavorite && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              aria-pressed={isFavorite}
              className={`p-1 rounded-md transition-colors ${
                isFavorite ? 'text-amber-500 hover:bg-amber-50' : 'text-neutral-300 hover:text-amber-500 hover:bg-neutral-50'
              }`}
            >
              <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs text-neutral-500">
        <p className="flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-neutral-400" />
          {pharmacy.address}, {pharmacy.city}
        </p>
        {pharmacy.distance != null && (
          <p className="flex items-center gap-1.5 pl-[18px]">
            <span className="text-brand-700 font-medium">{distanceLabel(pharmacy.distance)}</span> od Ciebie
          </p>
        )}
        {pharmacy.openingHours.weekdays != null && (
          <div className="flex items-start gap-1.5">
            <Clock size={12} className="shrink-0 text-neutral-400 mt-0.5" />
            <div className="flex-1 min-w-0">
              {pharmacy.openingHours.weekdays.includes(';') ? (
                <ul className="space-y-0.5">
                  {pharmacy.openingHours.weekdays.split(';').map((part, i) => (
                    <li key={i} className="leading-tight">{part.trim()}</li>
                  ))}
                </ul>
              ) : (
                <p className="leading-tight">Pn–Pt: {pharmacy.openingHours.weekdays}</p>
              )}
            </div>
          </div>
        )}
        {pharmacy.phone && (
          <p className="flex items-center gap-1.5">
            <Phone size={12} className="shrink-0 text-neutral-400" />
            {pharmacy.phone}
          </p>
        )}
      </div>
    </article>
  ),
);

PharmacyCard.displayName = 'PharmacyCard';
