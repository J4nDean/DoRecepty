import type { ReactNode } from 'react';
import { FileX } from 'lucide-react';

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
