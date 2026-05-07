import { ReactNode } from 'react';

export type BadgeVariant =
  | 'active'
  | 'partial'
  | 'done'
  | 'archived'
  | 'cancelled'
  | 'available'
  | 'unavailable'
  | 'partialAvail';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  done: 'bg-slate-100 text-slate-600',
  archived: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-red-100 text-red-600',
  available: 'bg-emerald-100 text-emerald-700',
  unavailable: 'bg-red-100 text-red-600',
  partialAvail: 'bg-amber-100 text-amber-700',
};

export const Badge = ({ variant, children }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant]}`}
  >
    {children}
  </span>
);
