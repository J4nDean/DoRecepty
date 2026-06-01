import { useState } from 'react';
import type { FormEvent, ChangeEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
  password: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', pesel: '', password: '', confirmPassword: '',
};

const validatePesel = (pesel: string): boolean => {
  if (!/^\d{11}$/.test(pesel)) return false;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const sum = weights.reduce((acc, w, i) => acc + w * parseInt(pesel[i]), 0);
  return (10 - (sum % 10)) % 10 === parseInt(pesel[10]);
};

const validate = (f: FormState): FieldErrors => {
  const errs: FieldErrors = {};
  if (!f.firstName.trim()) errs.firstName = 'Imię jest wymagane';
  if (!f.lastName.trim()) errs.lastName = 'Nazwisko jest wymagane';
  if (!f.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
    errs.email = 'Podaj prawidłowy adres email';
  if (!/^\d{11}$/.test(f.pesel))
    errs.pesel = 'PESEL musi zawierać dokładnie 11 cyfr';
  else if (!validatePesel(f.pesel))
    errs.pesel = 'Podany PESEL jest nieprawidłowy (błędna suma kontrolna)';
  if (f.password.length < 8)
    errs.password = 'Hasło musi mieć co najmniej 8 znaków';
  else if (!/[A-Z]/.test(f.password))
    errs.password = 'Hasło musi zawierać co najmniej jedną wielką literę';
  else if (!/\d/.test(f.password))
    errs.password = 'Hasło musi zawierać co najmniej jedną cyfrę';
  if (f.password !== f.confirmPassword)
    errs.confirmPassword = 'Hasła nie są zgodne';
  return errs;
};

const inputClass = (error?: string) =>
  `w-full h-10 px-3 border rounded-lg text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
    error
      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
      : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
  }`;

interface FieldProps {
  id: keyof FormState;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  rightSlot?: ReactNode;
}

const Field = ({
  id, label, type = 'text', autoComplete, placeholder,
  value, error, onChange, inputMode, maxLength, rightSlot,
}: FieldProps) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClass(error)} ${rightSlot ? 'pr-10' : ''}`}
      />
      {rightSlot}
    </div>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err: unknown) {
      const apiErr = err as { status?: number; errors?: Record<string, string> };
      setErrors(apiErr?.errors as FieldErrors ?? { email: 'Wystąpił błąd serwera. Spróbuj ponownie.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Konto zostało utworzone!</h2>
          <p className="text-sm text-slate-500">
            Za chwilę zostaniesz przekierowany do strony logowania...
          </p>
        </div>
      </div>
    );
  }

  const passwordToggle = (
    <button
      type="button"
      aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
      onClick={() => setShowPassword(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <img src="/icon.svg" alt="DoRecepty logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-slate-800">
            Do<span className="text-blue-600">Recepty</span>
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Utwórz konto</h1>
          <p className="text-sm text-slate-500 mb-6">
            Wypełnij formularz, aby zarejestrować się w systemie.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                id="firstName" label="Imię" autoComplete="given-name" placeholder="Jan"
                value={form.firstName} error={errors.firstName} onChange={set('firstName')}
              />
              <Field
                id="lastName" label="Nazwisko" autoComplete="family-name" placeholder="Kowalski"
                value={form.lastName} error={errors.lastName} onChange={set('lastName')}
              />
            </div>

            <Field
              id="email" label="Email" type="email" autoComplete="email"
              placeholder="jan.kowalski@example.com"
              value={form.email} error={errors.email} onChange={set('email')}
            />

            <Field
              id="pesel" label="PESEL" inputMode="numeric" maxLength={11}
              autoComplete="off" placeholder="11 cyfr"
              value={form.pesel} error={errors.pesel} onChange={set('pesel')}
            />

            <Field
              id="password" label="Hasło"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 znaków, wielka litera i cyfra"
              value={form.password} error={errors.password} onChange={set('password')}
              rightSlot={passwordToggle}
            />

            <Field
              id="confirmPassword" label="Potwierdź hasło"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password" placeholder="Powtórz hasło"
              value={form.confirmPassword} error={errors.confirmPassword}
              onChange={set('confirmPassword')}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {isLoading ? 'Tworzenie konta...' : 'Utwórz konto'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Masz już konto?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
