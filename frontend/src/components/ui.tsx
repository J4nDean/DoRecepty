import { useState, type ReactNode } from 'react';
import { FileX, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { fieldClass } from '../lib/theme';

export const Spinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const cls = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-9 h-9 border-[3px]' }[size];
  return (
    <div
      role="status"
      aria-label="Ładowanie"
      className={`${cls} border-neutral-200 border-t-brand-600 rounded-full animate-spin`}
    />
  );
};

export const EmptyState = ({
  title, description, icon, action,
}: { title: string; description?: string; icon?: ReactNode; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="mb-4 text-neutral-300">{icon ?? <FileX size={48} />}</div>
    <h3 className="text-base font-semibold text-neutral-700 mb-1">{title}</h3>
    {description && <p className="text-sm text-neutral-400 mb-5 max-w-xs">{description}</p>}
    {action}
  </div>
);

type AlertVariant = 'error' | 'success' | 'info';

const ALERT_STYLE: Record<AlertVariant, { box: string; Icon: typeof AlertCircle }> = {
  error:   { box: 'bg-rose-50 border-rose-200 text-rose-600',        Icon: AlertCircle },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-700', Icon: CheckCircle2 },
  info:    { box: 'bg-amber-50 border-amber-200 text-amber-700',      Icon: AlertCircle },
};

export const Alert = ({
  variant = 'error', children, className = '',
}: { variant?: AlertVariant; children: ReactNode; className?: string }) => {
  const { box, Icon } = ALERT_STYLE[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : undefined}
      className={`flex items-center gap-2 p-3 border rounded-lg text-sm ${box} ${className}`}
    >
      <Icon size={15} className="shrink-0" />
      {children}
    </div>
  );
};

export const SectionHeading = ({
  dot, label, count, className = '',
}: { dot: string; label: string; count?: number; className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${dot}`} />
    <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-widest">
      {label}
      {count != null && <span className="text-neutral-400 font-medium ml-1">({count})</span>}
    </h2>
  </div>
);

export const RevealToggle = ({
  shown, onToggle, size = 16,
}: { shown: boolean; onToggle: () => void; size?: number }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? 'Ukryj hasło' : 'Pokaż hasło'}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
  >
    {shown ? <EyeOff size={size} /> : <Eye size={size} />}
  </button>
);

export const PasswordField = ({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) => {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-600 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          className={`${fieldClass()} w-full px-3 py-2.5 pr-10`}
        />
        <RevealToggle shown={shown} onToggle={() => setShown(v => !v)} size={15} />
      </div>
    </div>
  );
};
