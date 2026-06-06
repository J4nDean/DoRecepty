import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Logo } from '../components/Layout';
import { Alert, RevealToggle } from '../components/ui';
import { fieldClass, BTN_PRIMARY } from '../theme';

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
      const stored = localStorage.getItem('rx_user');
      const role = stored ? JSON.parse(stored).role : null;
      navigate(role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch {
      setError('Nieprawidłowy email lub hasło. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      <div className="hidden md:flex md:w-5/12 lg:w-2/5 bg-gradient-to-br from-brand-600 to-brand-900 flex-col justify-between p-10 lg:p-14">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="DoRecepty" className="w-10 h-10 rounded-lg shadow-sm" />
          <Logo tone="inverted" className="text-xl" />
        </div>

        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
            System e-recept
          </p>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug tracking-tight">
            Zarządzaj swoimi e-receptami w jednym miejscu
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Szybki dostęp do recept, wyszukiwarka aptek i leków w pobliżu.
            Wszystko, czego potrzebujesz jako pacjent — w jednym miejscu.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { label: 'Aktywne recepty', value: 'Zawsze pod ręką' },
              { label: 'Pobliskie apteki', value: 'Mapa w czasie rzeczywistym' },
              { label: 'Historia recept', value: 'Pełne archiwum' },
              { label: 'Dostępność leków', value: 'Sprawdź przed wyjściem' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 p-4 border border-white/15">
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-white/70 text-xs mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/60 text-xs">© 2025 DoRecepty</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 md:hidden">
            <img src="/icon.svg" alt="DoRecepty" className="w-8 h-8 rounded-lg shadow-sm" />
            <Logo tone="neutral" />
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-1 tracking-tight">Zaloguj się</h1>
          <p className="text-sm text-neutral-500 mb-8">Wprowadź swoje dane, aby kontynuować.</p>

          {error && <Alert className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jan.kowalski@example.com"
                required
                className={`${fieldClass()} w-full h-11 px-4`}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">Hasło</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${fieldClass()} w-full h-11 px-4 pr-11`}
                />
                <RevealToggle shown={showPassword} onToggle={() => setShowPassword(v => !v)} size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${BTN_PRIMARY} w-full h-11 rounded-lg text-sm mt-2 shadow-sm`}
            >
              {isLoading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <p className="text-center text-sm text-neutral-500 mt-7">
            Nie masz konta?{' '}
            <Link to="/rejestracja" className="text-brand-700 font-semibold hover:underline">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
