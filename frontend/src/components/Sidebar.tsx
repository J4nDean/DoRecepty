import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Archive,
  MapPin,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recepty/aktywne',   icon: FileCheck,       label: 'Aktywne recepty' },
  { to: '/recepty/archiwalne',icon: Archive,         label: 'Archiwalne recepty' },
  { to: '/apteki',            icon: MapPin,          label: 'Najbliższe apteki' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
    isActive
      ? 'bg-blue-50 text-blue-700 font-semibold'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
  }`;

export const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-white border-r border-slate-200 h-screen sticky top-0 z-40">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-[15px] tracking-tight">
            finder<span className="text-blue-600">·rx</span>
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            {({ isActive }) => (
              <>
                <Icon size={17} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-1">
        <div className="px-3 py-2.5 rounded-lg bg-slate-50 mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-blue-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">{user?.pesel}</p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Wyloguj się
        </button>
      </div>
    </aside>
  );
};
