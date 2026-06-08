export const fieldClass = (error = false): string =>
  'rounded-xl bg-white text-sm text-neutral-900 placeholder:text-neutral-400 ' +
  'focus:outline-none focus:ring-2 transition-all border ' +
  (error
    ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
    : 'border-neutral-200 focus:border-brand-400 focus:ring-brand-600/20');

export const BTN_PRIMARY =
  'bg-brand-600 text-white font-semibold hover:bg-brand-700 ' +
  'disabled:opacity-60 disabled:cursor-not-allowed transition-colors';

export const CARD_GRID =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

export const openBadgeColor = (isOpen: boolean): string =>
  isOpen ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-neutral-100 text-neutral-500 ring-neutral-200';
