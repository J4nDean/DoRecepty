interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => (
  <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center shrink-0">
    <div className="min-w-0">
      <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5 truncate">{subtitle}</p>
      )}
    </div>
  </header>
);
