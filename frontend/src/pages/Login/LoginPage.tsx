import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Nieprawidłowy email lub hasło. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-[#1B3A6B] flex-col justify-between p-10 lg:p-14">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Stethoscope size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            finder<span className="text-blue-300">·rx</span>
          </span>
        </div>

        <div>
          <p className="text-blue-300 text-xs font-semibold uppercase tracking-widest mb-4">
            System e-recept
          </p>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
            Zarządzaj swoimi e-receptami w jednym miejscu
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Szybki dostęp do recept, wyszukiwarka aptek i leków w pobliżu.
            Wszystko czego potrzebujesz jako pacjent — w jednym miejscu.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Aktywne recepty', value: 'Zawsze pod ręką' },
              { label: 'Pobliskie apteki', value: 'Mapa w czasie rzeczywistym' },
              { label: 'Historia recept', value: 'Pełne archiwum' },
              { label: 'Dostępność leków', value: 'Sprawdź przed wyjściem' },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-blue-300 text-xs mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-400 text-xs">© 2025 finder·rx</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 md:hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Stethoscope size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">
              finder<span className="text-blue-600">·rx</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Zaloguj się</h1>
          <p className="text-sm text-slate-500 mb-8">
            Wprowadź swoje dane, aby kontynuować.
          </p>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan.kowalski@example.com"
                required
                className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Hasło
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-11 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Nie masz konta?{' '}
            <Link
              to="/rejestracja"
              className="text-blue-600 font-semibold hover:underline"
            >
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
