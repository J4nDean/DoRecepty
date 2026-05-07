interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
};

export const Spinner = ({ size = 'md' }: SpinnerProps) => (
  <div
    role="status"
    aria-label="Ładowanie"
    className={`${sizes[size]} border-slate-200 border-t-blue-600 rounded-full animate-spin`}
  />
);
