import { ReactNode } from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="mb-4 text-slate-300">{icon ?? <FileX size={48} />}</div>
    <h3 className="text-base font-semibold text-slate-600 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-400 mb-5 max-w-xs">{description}</p>}
    {action}
  </div>
);
