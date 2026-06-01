import type { ReactNode } from 'react';
import { NavLink, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Archive, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '../AuthContext';

// Cała powłoka aplikacji: nawigacja boczna, górna belka, pasek dolny (mobile),
// układ strony oraz strażnik tras wymagających logowania.

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Pulpit', short: 'Pulpit' },
  { to: '/recepty/aktywne', icon: FileCheck, label: 'Aktywne recepty', short: 'Recepty' },
  { to: '/recepty/archiwalne', icon: Archive, label: 'Archiwalne recepty', short: 'Archiwum' },
  { to: '/apteki', icon: MapPin, label: 'Najbliższe apteki', short: 'Apteki' },
];

const Logo = ({ className = '' }: { className?: string }) => (
  <span className={`font-semibold tracking-tight text-brand-800 ${className}`}>
    <span className="text-brand-400">Do</span>Recepty
  </span>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-neutral-200 h-screen sticky top-0 z-40">
      <div className="px-5 py-5 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="DoRecepty" className="w-8 h-8 rounded-md shadow-sm" />
          <Logo className="text-[15px]" />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-brand-600 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={`shrink-0 ${isActive ? 'text-brand-600' : 'text-neutral-400'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-neutral-100 pt-3 space-y-1">
        <button
          onClick={() => navigate('/profil')}
          className="w-full px-3 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-neutral-400 font-mono">{user?.pesel}</p>
            </div>
          </div>
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut size={16} />
          Wyloguj się
        </button>
      </div>
    </aside>
  );
};

const Header = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="safe-area-top bg-white/80 backdrop-blur border-b border-neutral-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center shrink-0">
    <div className="min-w-0">
      <h1 className="text-base sm:text-lg font-bold text-neutral-900 leading-tight truncate tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 truncate">{subtitle}</p>}
    </div>
  </header>
);

const BottomNav = () => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-area-bottom">
    <div className="flex items-stretch">
      {NAV.map(({ to, icon: Icon, short }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-700' : 'text-neutral-400'
            }`
          }
        >
          <Icon size={20} />
          <span>{short}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

export const AppLayout = ({
  children, title, subtitle,
}: { children: ReactNode; title: string; subtitle?: string }) => (
  <div className="flex h-screen bg-neutral-50 overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      <Header title={title} subtitle={subtitle} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-5 pb-24 md:p-6 md:pb-6">{children}</main>
    </div>
    <BottomNav />
  </div>
);

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export { Logo };
