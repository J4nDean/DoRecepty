import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileCheck, Archive, MapPin } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Pulpit' },
  { to: '/recepty/aktywne', icon: FileCheck, label: 'Recepty' },
  { to: '/recepty/archiwalne', icon: Archive, label: 'Archiwum' },
  { to: '/apteki', icon: MapPin, label: 'Apteki' },
];

export const BottomNav = () => (
  <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
    <div className="flex items-stretch">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-slate-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </div>
  </nav>
);
