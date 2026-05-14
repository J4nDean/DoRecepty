import { Search, Crosshair } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onLocate?: () => void;
  isLocating?: boolean;
  className?: string;
  defaultValue?: string;
}

export const SearchBar = ({
  placeholder = 'Szukaj...',
  onSearch,
  onLocate,
  isLocating = false,
  className = '',
  defaultValue = '',
}: SearchBarProps) => {
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`} role="search">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          size={17}
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`w-full pl-10 ${onLocate ? 'pr-11' : 'pr-4'} h-11 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all`}
        />
        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            disabled={isLocating}
            title="Użyj mojej lokalizacji"
            aria-label="Użyj mojej lokalizacji"
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${
              isLocating
                ? 'text-blue-600 animate-pulse'
                : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            <Crosshair size={18} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-5 h-11 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
      >
        Szukaj
      </button>
    </form>
  );
};
