import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Pencil, Search, Building2, X } from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { Spinner, EmptyState } from '../components/ui';
import {
  fetchAdminPharmacies, createPharmacy, updatePharmacy, type PharmacyInput,
} from '../api';
import type { ApiPharmacy } from '../types';

const EMPTY_FORM: PharmacyInput = {
  name: '', address: '', city: '', postalCode: '', phone: '',
  latitude: null, longitude: null, status: 'ACTIVE',
  openingHoursWeekdays: '', openingHoursSaturday: '', openingHoursSunday: '',
};

const inputClass =
  'w-full h-10 px-3 border border-neutral-200 rounded-lg text-sm bg-white text-neutral-900 ' +
  'placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-900/20 transition-all';

const labelClass = 'block text-xs font-semibold text-neutral-600 mb-1';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className={labelClass}>{label}</label>
    {children}
  </div>
);

const toForm = (p: ApiPharmacy): PharmacyInput => ({
  name: p.name ?? '',
  address: p.address ?? '',
  city: p.city ?? '',
  postalCode: p.postalCode ?? '',
  phone: p.phone ?? '',
  latitude: p.latitude,
  longitude: p.longitude,
  status: p.status ?? 'ACTIVE',
  openingHoursWeekdays: p.openingHoursWeekdays ?? '',
  openingHoursSaturday: p.openingHoursSaturday ?? '',
  openingHoursSunday: p.openingHoursSunday ?? '',
});

const AdminPage = () => {
  const [pharmacies, setPharmacies] = useState<ApiPharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [form, setForm] = useState<PharmacyInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      setPharmacies(await fetchAdminPharmacies());
    } catch {
      setError('Nie udało się pobrać listy aptek');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (key: keyof PharmacyInput, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const setCoord = (key: 'latitude' | 'longitude', value: string) =>
    setForm(prev => ({ ...prev, [key]: value === '' ? null : Number(value) }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError('');
  };

  const startEdit = (p: ApiPharmacy) => {
    setForm(toForm(p));
    setEditingId(p.id);
    setError('');
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Nazwa, adres i miasto są wymagane');
      return;
    }

    setSaving(true);
    try {
      if (editingId != null) {
        await updatePharmacy(editingId, form);
        setMessage('Zaktualizowano dane apteki');
      } else {
        await createPharmacy(form);
        setMessage('Dodano nową aptekę');
      }
      resetForm();
      await load();
    } catch {
      setError('Nie udało się zapisać apteki');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pharmacies;
    return pharmacies.filter(p =>
      [p.name, p.city, p.address].some(v => v?.toLowerCase().includes(q)));
  }, [pharmacies, query]);

  return (
    <AppLayout title="Panel administratora" subtitle="Zarządzanie rejestrem aptek">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl">
        {/* Formularz dodawania / edycji (WF-11, WF-12) */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              {editingId != null ? <Pencil size={18} /> : <Plus size={18} />}
              {editingId != null ? 'Edytuj aptekę' : 'Dodaj nową aptekę'}
            </h2>
            {editingId != null && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-rose-600 transition-colors"
              >
                <X size={14} /> Anuluj
              </button>
            )}
          </div>

          {error && (
            <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {message}
            </div>
          )}

          <Field label="Nazwa apteki *">
            <input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Apteka pod Orłem" />
          </Field>
          <Field label="Adres *">
            <input className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} placeholder="ul. Główna 12" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Miasto *">
              <input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Warszawa" />
            </Field>
            <Field label="Kod pocztowy">
              <input className={inputClass} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="00-001" />
            </Field>
          </div>

          <Field label="Telefon">
            <input className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="22 123 45 67" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Szer. geogr. (latitude)">
              <input className={inputClass} type="number" step="any" value={form.latitude ?? ''} onChange={e => setCoord('latitude', e.target.value)} placeholder="52.2297" />
            </Field>
            <Field label="Dł. geogr. (longitude)">
              <input className={inputClass} type="number" step="any" value={form.longitude ?? ''} onChange={e => setCoord('longitude', e.target.value)} placeholder="21.0122" />
            </Field>
          </div>

          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">Aktywna</option>
              <option value="INACTIVE">Nieaktywna</option>
            </select>
          </Field>

          <Field label="Godziny otwarcia (pon.–pt.)">
            <input className={inputClass} value={form.openingHoursWeekdays} onChange={e => set('openingHoursWeekdays', e.target.value)} placeholder="08:00 - 20:00" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sobota">
              <input className={inputClass} value={form.openingHoursSaturday} onChange={e => set('openingHoursSaturday', e.target.value)} placeholder="09:00 - 14:00" />
            </Field>
            <Field label="Niedziela">
              <input className={inputClass} value={form.openingHoursSunday} onChange={e => set('openingHoursSunday', e.target.value)} placeholder="nieczynne" />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {saving ? 'Zapisywanie...' : editingId != null ? 'Zapisz zmiany' : 'Dodaj aptekę'}
          </button>
        </form>

        {/* Lista aptek */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className={inputClass + ' pl-9'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Szukaj apteki..."
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Brak aptek"
              description="Dodaj pierwszą aptekę za pomocą formularza obok."
              icon={<Building2 size={40} />}
            />
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                    editingId === p.id ? 'border-brand-300 bg-brand-50' : 'border-neutral-100 hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{p.address}, {p.city}</p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      {p.latitude != null && p.longitude != null
                        ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                        : 'brak współrzędnych'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="flex items-center gap-1.5 shrink-0 h-9 px-3 border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-colors"
                  >
                    <Pencil size={14} /> Edytuj
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
