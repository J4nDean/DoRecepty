import { useNavigate } from 'react-router-dom';
import { Pill, Calendar, ChevronRight, User, AlertTriangle } from 'lucide-react';
import type { Prescription } from '../types/prescription';
import { Badge } from './ui/Badge';
import type { BadgeVariant } from './ui/Badge';
import { formatDateShort } from '../utils/formatDate';
import { daysUntilExpiry, expiryWarningText, isExpiringSoon } from '../utils/dateUtils';
import { useMetadata } from '../context/MetadataContext';

const statusToBadge: Record<string, BadgeVariant> = {
  AKTYWNA: 'active',
  CZĘŚCIOWO_ZREALIZOWANA: 'partial',
  ZREALIZOWANA: 'done',
  ARCHIWALNA: 'archived',
  ANULOWANA: 'cancelled',
};

interface PrescriptionCardProps {
  prescription: Prescription;
  compact?: boolean;
}

export const PrescriptionCard = ({ prescription, compact = false }: PrescriptionCardProps) => {
  const navigate = useNavigate();
  const { metadata, labelOf } = useMetadata();

  const expiringSoon = isExpiringSoon(prescription.status, prescription.expiryDate);
  const days = expiringSoon ? daysUntilExpiry(prescription.expiryDate) : 0;

  return (
    <article
      onClick={() => navigate(`/recepty/${prescription.id}`)}
      className={`bg-white rounded-xl border shadow-sm p-5 transition-all cursor-pointer hover:shadow-md ${
        expiringSoon
          ? 'border-amber-400 hover:border-amber-500 ring-1 ring-amber-100'
          : 'border-slate-100 hover:border-blue-200'
      }`}
      aria-label={`Recepta ${prescription.number}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">
            Numer recepty
          </p>
          <p className="font-mono text-sm font-bold text-slate-800 truncate">
            {prescription.number}
          </p>
        </div>
        <Badge variant={statusToBadge[prescription.status] ?? 'done'}>
          {labelOf(metadata.prescriptionStatuses, prescription.status)}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500 mb-3 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDateShort(prescription.issueDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Pill size={13} />
            {prescription.drugs.length}{' '}
            {prescription.drugs.length === 1 ? 'lek' : 'leki'}
          </span>
        </div>
        {expiringSoon && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle size={12} />
            {expiryWarningText(days)}
          </div>
        )}
      </div>

      {!compact && (
        <p className="flex items-center gap-1.5 text-xs text-slate-400">
          <User size={12} />
          {prescription.doctorName} · {prescription.doctorSpecialty}
        </p>
      )}

      <div className="flex items-center gap-1 text-[12px] text-blue-600 font-semibold mt-3 border-t border-slate-50 pt-3">
        Szczegóły i dostępność leków
        <ChevronRight size={13} />
      </div>
    </article>
  );
};
