import { Search, Crosshair } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { fieldClass, BTN_PRIMARY } from '../lib/theme';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onValueChange?: (query: string) => void;
  onLocate?: () => void;
  isLocating?: boolean;
  className?: string;
  defaultValue?: string;
}

export const SearchBar = ({
  placeholder = 'Szukaj...',
  onSearch,
  onValueChange,
  onLocate,
  isLocating = false,
  className = '',
  defaultValue = '',
}: SearchBarProps) => {
  const [value, setValue] = useState(defaultValue);

  const updateValue = (next: string) => {
    setValue(next);
    onValueChange?.(next);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') updateValue('');
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`} role="search">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={17} aria-hidden />
        <input
          type="search"
          value={value}
          onChange={e => updateValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${fieldClass()} w-full pl-10 ${onLocate ? 'pr-11' : 'pr-4'} h-11`}
        />
        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            disabled={isLocating}
            title="Użyj mojej lokalizacji"
            aria-label="Użyj mojej lokalizacji"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          >
            <Crosshair size={18} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className={`${BTN_PRIMARY} px-5 h-11 rounded-xl text-sm shrink-0`}
      >
        Szukaj
      </button>
    </form>
  );
};
