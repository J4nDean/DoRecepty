import { useState } from 'react';
import { Lock } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { Alert, PasswordField } from '../components/ui';
import { BTN_PRIMARY } from '../theme';
import { useAuth } from '../AuthContext';
import { changePassword } from '../api';

export default function ProfilePage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Nowe hasła nie są identyczne.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Nowe hasło musi mieć co najmniej 8 znaków.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(user!.id, currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } };
      setError(
        axiosErr?.response?.status === 422
          ? 'Nieprawidłowe obecne hasło.'
          : 'Wystąpił błąd. Spróbuj ponownie.',
      );
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { label: 'Imię', value: user?.firstName },
    { label: 'Nazwisko', value: user?.lastName },
    { label: 'Email', value: user?.email },
    { label: 'PESEL', value: user?.pesel, mono: true },
  ];

  return (
    <AppLayout title="Profil użytkownika" subtitle="Twoje dane i ustawienia konta">
      <div className="max-w-2xl space-y-4 sm:space-y-5">
        <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 truncate">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ label, value, mono }) => (
              <div key={label} className="min-w-0">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-medium text-neutral-900 break-all ${mono ? 'font-mono' : ''}`}>
                  {value ?? '—'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Lock size={15} className="text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">Zmiana hasła</h3>
          </div>

          {success && <Alert variant="success" className="mb-4">Hasło zostało pomyślnie zmienione.</Alert>}
          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField label="Obecne hasło" value={currentPassword} onChange={setCurrentPassword} />
            <PasswordField label="Nowe hasło" value={newPassword} onChange={setNewPassword} />
            <PasswordField label="Potwierdź nowe hasło" value={confirmPassword} onChange={setConfirmPassword} />

            <button
              type="submit"
              disabled={loading}
              className={`${BTN_PRIMARY} w-full text-sm rounded-xl px-4 py-2.5 mt-1`}
            >
              {loading ? 'Zapisywanie…' : 'Zmień hasło'}
            </button>
          </form>
        </section>
      </div>
    </AppLayout>
  );
}
