import { useNavigate } from 'react-router-dom';
import { Pill, Calendar, ChevronRight, AlertTriangle } from 'lucide-react';
import type { Prescription } from '../types';
import { statusMetaOf, formatDateShort, daysUntilExpiry, expiryWarningText, isExpiringSoon } from '../utils';
import { useMetadata } from '../MetadataContext';

export const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => {
  const navigate = useNavigate();
  const { metadata, labelOf } = useMetadata();

  const meta = statusMetaOf(prescription.status);
  const expiringSoon = isExpiringSoon(prescription.status, prescription.expiryDate);
  const days = expiringSoon ? daysUntilExpiry(prescription.expiryDate) : 0;
  const drugCount = prescription.drugs.length;

  return (
    <article
      onClick={() => navigate(`/recepty/${prescription.id}`)}
      className="group relative overflow-hidden bg-white rounded-2xl border border-neutral-200 cursor-pointer transition-all hover:border-neutral-300 hover:shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)]"
      aria-label={`Recepta ${prescription.number}`}
    >
      {/* lewy pasek w kolorze statusu */}
      <span className={`absolute inset-y-0 left-0 w-1 ${meta.rail}`} aria-hidden />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[10px] text-neutral-400 uppercase tracking-[0.12em] mb-1">Numer recepty</p>
            <p className="font-mono text-sm font-semibold text-neutral-900 truncate">{prescription.number}</p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${meta.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {labelOf(metadata.prescriptionStatuses, prescription.status)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-neutral-400" />
            {prescription.issueDate ? formatDateShort(prescription.issueDate) : '—'}
          </span>
          <span className="flex items-center gap-1.5">
            <Pill size={13} className="text-neutral-400" />
            {drugCount} {drugCount === 1 ? 'lek' : 'leki'}
          </span>
        </div>

        {expiringSoon && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-2.5 py-1.5 w-fit">
            <AlertTriangle size={12} />
            {expiryWarningText(days)}
          </div>
        )}

        <div className="flex items-center gap-1 text-[12px] text-brand-700 font-medium mt-4 pt-4 border-t border-neutral-100 group-hover:text-brand-800 transition-colors">
          Szczegóły i dostępność leków
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
};
