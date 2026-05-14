import { Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
  defaultValue?: string;
}

export const SearchBar = ({
  placeholder = 'Szukaj...',
  onSearch,
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
          className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
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
