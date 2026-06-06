import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Plus, Pencil, Search, Building2, X, MapPin, CheckCircle2, AlertCircle,
  ClipboardList, FileText, ChevronDown, Crosshair,
} from 'lucide-react';
import { AppLayout } from '../components/Layout';
import { Spinner, EmptyState } from '../components/ui';
import { PharmacyCard } from '../components/PharmacyCard';
import PharmacyMapView from '../components/PharmacyMapView';
import {
  fetchAdminPharmacies, createPharmacy, updatePharmacy, type PharmacyInput,
  fetchAdminPrescriptions, createAdminPrescription, updateAdminPrescriptionStatus,
  fetchAdminUsers, searchAdminMedications,
  searchPharmacies, fetchNearbyByLocation, getUserLocation,
  type AdminPrescription, type AdminUser, type AdminMedication,
} from '../api';
import { haversineKm, type LatLng } from '../utils';
import type { ApiPharmacy, Pharmacy } from '../types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const inputClass =
  'w-full h-10 px-3 border border-neutral-200 rounded-lg text-sm bg-white text-neutral-900 ' +
  'placeholder:text-neutral-400 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-900/20 transition-all';
const labelClass = 'block text-xs font-semibold text-neutral-600 mb-1';
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div><label className={labelClass}>{label}</label>{children}</div>
);

interface StatCardProps { icon: React.ReactNode; label: string; value: number | string; color: string }
const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-4">
    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-neutral-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  </div>
);

const STATUSES = [
  'AKTYWNA', 'NIEZREALIZOWANA', 'CZĘŚCIOWO_ZREALIZOWANA',
  'ZREALIZOWANA', 'ARCHIWALNA', 'ANULOWANA',
];

const STATUS_COLORS: Record<string, string> = {
  AKTYWNA: 'bg-emerald-100 text-emerald-700',
  NIEZREALIZOWANA: 'bg-blue-100 text-blue-700',
  CZĘŚCIOWO_ZREALIZOWANA: 'bg-amber-100 text-amber-700',
  ZREALIZOWANA: 'bg-neutral-100 text-neutral-600',
  ARCHIWALNA: 'bg-neutral-100 text-neutral-500',
  ANULOWANA: 'bg-rose-100 text-rose-700',
};

const rand4 = () => Math.floor(1000 + Math.random() * 9000).toString();

// ─── Pharmacy tab ─────────────────────────────────────────────────────────────

const EMPTY_FORM: PharmacyInput = {
  name: '', address: '', city: '', postalCode: '', phone: '',
  latitude: null, longitude: null, status: 'ACTIVE',
  openingHoursWeekdays: '', openingHoursSaturday: '', openingHoursSunday: '',
};

const toForm = (p: ApiPharmacy): PharmacyInput => ({
  name: p.name ?? '', address: p.address ?? '', city: p.city ?? '',
  postalCode: p.postalCode ?? '', phone: p.phone ?? '',
  latitude: p.latitude, longitude: p.longitude, status: p.status ?? 'ACTIVE',
  openingHoursWeekdays: p.openingHoursWeekdays ?? '',
  openingHoursSaturday: p.openingHoursSaturday ?? '',
  openingHoursSunday: p.openingHoursSunday ?? '',
});

const PharmacyTab = () => {
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
    try { setPharmacies(await fetchAdminPharmacies()); }
    catch { setError('Nie udało się pobrać listy aptek'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: pharmacies.length,
    active: pharmacies.filter(p => !p.status || p.status === 'ACTIVE' || p.status === 'AKTYWNA').length,
    noCoords: pharmacies.filter(p => p.latitude == null || p.longitude == null).length,
  }), [pharmacies]);

  const set = (key: keyof PharmacyInput, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const setCoord = (key: 'latitude' | 'longitude', value: string) =>
    setForm(prev => ({ ...prev, [key]: value === '' ? null : Number(value) }));
  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); setError(''); };
  const startEdit = (p: ApiPharmacy) => {
    setForm(toForm(p)); setEditingId(p.id); setError(''); setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Nazwa, adres i miasto są wymagane'); return;
    }
    setSaving(true);
    try {
      if (editingId != null) { await updatePharmacy(editingId, form); setMessage('Zaktualizowano dane apteki'); }
      else { await createPharmacy(form); setMessage('Dodano nową aptekę'); }
      resetForm(); await load();
    } catch { setError('Nie udało się zapisać apteki'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pharmacies;
    return pharmacies.filter(p => [p.name, p.city, p.address].some(v => v?.toLowerCase().includes(q)));
  }, [pharmacies, query]);

  return (
    <div className="space-y-6">
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Building2 size={20} className="text-brand-600" />} label="Łącznie aptek" value={stats.total} color="bg-brand-50" />
          <StatCard icon={<CheckCircle2 size={20} className="text-emerald-600" />} label="Aktywne" value={stats.active} color="bg-emerald-50" />
          <StatCard icon={<MapPin size={20} className="text-amber-600" />} label="Brak współrzędnych" value={stats.noCoords} color="bg-amber-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              {editingId != null ? <Pencil size={18} /> : <Plus size={18} />}
              {editingId != null ? 'Edytuj aptekę' : 'Dodaj nową aptekę'}
            </h2>
            {editingId != null && (
              <button type="button" onClick={resetForm} className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-rose-600 transition-colors">
                <X size={14} /> Anuluj
              </button>
            )}
          </div>
          {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={15} className="shrink-0" />{error}</div>}
          {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0" />{message}</div>}
          <Field label="Nazwa apteki *"><input className={inputClass} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Apteka pod Orłem" /></Field>
          <Field label="Adres *"><input className={inputClass} value={form.address} onChange={e => set('address', e.target.value)} placeholder="ul. Główna 12" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Miasto *"><input className={inputClass} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Warszawa" /></Field>
            <Field label="Kod pocztowy"><input className={inputClass} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="00-001" /></Field>
          </div>
          <Field label="Telefon"><input className={inputClass} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="22 123 45 67" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Szer. geogr."><input className={inputClass} type="number" step="any" value={form.latitude ?? ''} onChange={e => setCoord('latitude', e.target.value)} placeholder="52.2297" /></Field>
            <Field label="Dł. geogr."><input className={inputClass} type="number" step="any" value={form.longitude ?? ''} onChange={e => setCoord('longitude', e.target.value)} placeholder="21.0122" /></Field>
          </div>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="ACTIVE">Aktywna</option>
              <option value="INACTIVE">Nieaktywna</option>
            </select>
          </Field>
          <Field label="Godziny otwarcia (pon.–pt.)"><input className={inputClass} value={form.openingHoursWeekdays} onChange={e => set('openingHoursWeekdays', e.target.value)} placeholder="08:00 - 20:00" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sobota"><input className={inputClass} value={form.openingHoursSaturday} onChange={e => set('openingHoursSaturday', e.target.value)} placeholder="09:00 - 14:00" /></Field>
            <Field label="Niedziela"><input className={inputClass} value={form.openingHoursSunday} onChange={e => set('openingHoursSunday', e.target.value)} placeholder="nieczynne" /></Field>
          </div>
          <button type="submit" disabled={saving} className="w-full h-11 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
            {saving ? 'Zapisywanie...' : editingId != null ? 'Zapisz zmiany' : 'Dodaj aptekę'}
          </button>
        </form>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={inputClass + ' pl-9'} value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj apteki..." />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Brak aptek" description="Dodaj pierwszą aptekę za pomocą formularza obok." icon={<Building2 size={40} />} />
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
              {filtered.map(p => (
                <div key={p.id} className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${editingId === p.id ? 'border-brand-300 bg-brand-50' : 'border-neutral-100 hover:bg-neutral-50'}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{p.name}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${!p.status || p.status === 'ACTIVE' || p.status === 'AKTYWNA' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {!p.status || p.status === 'ACTIVE' || p.status === 'AKTYWNA' ? 'aktywna' : 'nieaktywna'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate">{p.address}, {p.city}</p>
                    <p className="text-[11px] font-mono mt-0.5">
                      {p.latitude != null && p.longitude != null
                        ? <span className="text-neutral-400">{p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}</span>
                        : <span className="text-amber-500">brak współrzędnych</span>}
                    </p>
                  </div>
                  <button type="button" onClick={() => startEdit(p)} className="flex items-center gap-1.5 shrink-0 h-9 px-3 border border-neutral-200 rounded-lg bg-white text-xs font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-colors">
                    <Pencil size={14} /> Edytuj
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Prescription tab ─────────────────────────────────────────────────────────

interface PrescriptionItem { medicationId: number; medicationName: string; quantity: number; dosageInstructions: string }

const MedSearch = ({ onSelect }: { onSelect: (m: AdminMedication) => void }) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<AdminMedication[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const registryLoaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Pusty `q` → backend zwraca rejestr leków (pierwsze 30). Niepusty → wyszukiwanie po nazwie.
  const run = (val: string) => {
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await searchAdminMedications(val.trim());
        setResults(res); setOpen(true);
        if (!val.trim()) registryLoaded.current = true;
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 250);
  };

  const handleChange = (val: string) => { setQ(val); run(val); };

  const handleFocus = () => {
    setOpen(true);
    if (!registryLoaded.current && results.length === 0) run('');
  };

  const pick = (m: AdminMedication) => { onSelect(m); setQ(m.name); setOpen(false); };

  const isRegistry = q.trim().length === 0;

  return (
    <div className="relative">
      <input
        className={inputClass}
        value={q}
        onChange={e => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Wpisz nazwę leku lub wybierz z rejestru..."
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 sticky top-0 bg-white">
            {isRegistry ? 'Rejestr leków' : 'Wyniki wyszukiwania'}
          </div>
          {loading ? (
            <div className="px-3 py-3 text-xs text-neutral-400">Ładowanie...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-neutral-400">Brak leków do wyświetlenia</div>
          ) : (
            results.map(m => (
              <button key={m.id} type="button" onMouseDown={() => pick(m)} className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 transition-colors">
                <span className="font-medium text-neutral-900">{m.name}</span>
                {m.strength && <span className="text-neutral-400 ml-1 text-xs">{m.strength}</span>}
                {m.pharmaceuticalForm && <span className="text-neutral-300 ml-1 text-[11px]">· {m.pharmaceuticalForm}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const PrescriptionsTab = () => {
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [patientId, setPatientId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [expirationDate, setExpirationDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState('AKTYWNA');
  const [doctorNpwz, setDoctorNpwz] = useState('');
  const [items, setItems] = useState<PrescriptionItem[]>([]);

  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatus, setEditingStatus] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const [p, u] = await Promise.all([fetchAdminPrescriptions(), fetchAdminUsers()]);
      setPrescriptions(p); setUsers(u);
    } catch { setError('Nie udało się załadować danych'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: prescriptions.length,
    active: prescriptions.filter(p => ['AKTYWNA', 'NIEZREALIZOWANA', 'CZĘŚCIOWO_ZREALIZOWANA'].includes(p.status)).length,
    archived: prescriptions.filter(p => ['ARCHIWALNA', 'ZREALIZOWANA', 'ANULOWANA'].includes(p.status)).length,
  }), [prescriptions]);

  const addItem = () => setItems(prev => [...prev, { medicationId: 0, medicationName: '', quantity: 1, dosageInstructions: '' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const setItemMed = (i: number, m: AdminMedication) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, medicationId: m.id, medicationName: m.name } : item));
  const setItemField = (i: number, key: keyof PrescriptionItem, value: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));

  const resetForm = () => {
    setPatientId(''); setAccessCode(''); setStatus('AKTYWNA'); setDoctorNpwz(''); setItems([]);
    setIssueDate(new Date().toISOString().slice(0, 10));
    const d = new Date(); d.setDate(d.getDate() + 30);
    setExpirationDate(d.toISOString().slice(0, 10));
    setError(''); setMessage('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setMessage('');
    if (!patientId) { setError('Wybierz pacjenta'); return; }
    if (!accessCode.trim()) { setError('Podaj kod dostępu (4 cyfry)'); return; }
    if (items.some(i => !i.medicationId)) { setError('Wybierz lek dla każdej pozycji'); return; }
    setSaving(true);
    try {
      await createAdminPrescription({
        patientId: Number(patientId), accessCode: accessCode.trim(),
        issueDate, expirationDate, status, doctorNpwz: doctorNpwz || undefined,
        items: items.map(i => ({ medicationId: i.medicationId, quantity: i.quantity, dosageInstructions: i.dosageInstructions || undefined })),
      });
      setMessage('Recepta dodana'); resetForm(); await load();
    } catch { setError('Nie udało się dodać recepty'); }
    finally { setSaving(false); }
  };

  const saveStatus = async (id: number) => {
    try {
      await updateAdminPrescriptionStatus(id, editingStatus);
      setEditingStatusId(null);
      setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: editingStatus } : p));
    } catch { setError('Nie udało się zmienić statusu'); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter(p =>
      [p.accessCode, p.patientName, p.patientPesel, p.status].some(v => v?.toLowerCase().includes(q)));
  }, [prescriptions, query]);

  return (
    <div className="space-y-6">
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<FileText size={20} className="text-brand-600" />} label="Łącznie recept" value={stats.total} color="bg-brand-50" />
          <StatCard icon={<CheckCircle2 size={20} className="text-emerald-600" />} label="Aktywne" value={stats.active} color="bg-emerald-50" />
          <StatCard icon={<ClipboardList size={20} className="text-neutral-500" />} label="Archiwalne / zakończone" value={stats.archived} color="bg-neutral-100" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formularz dodawania */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4 h-fit">
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2"><Plus size={18} /> Dodaj receptę</h2>
          {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={15} className="shrink-0" />{error}</div>}
          {message && <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={15} className="shrink-0" />{message}</div>}

          <Field label="Pacjent *">
            <select className={inputClass} value={patientId} onChange={e => setPatientId(e.target.value)}>
              <option value="">Wybierz pacjenta...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.pesel}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kod dostępu (4 cyfry) *">
              <div className="flex gap-2">
                <input className={inputClass} maxLength={4} value={accessCode} onChange={e => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" />
                <button type="button" onClick={() => setAccessCode(rand4())} className="shrink-0 h-10 px-3 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">Losuj</button>
              </div>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data wystawienia"><input type="date" className={inputClass} value={issueDate} onChange={e => setIssueDate(e.target.value)} /></Field>
            <Field label="Data ważności"><input type="date" className={inputClass} value={expirationDate} onChange={e => setExpirationDate(e.target.value)} /></Field>
          </div>

          <Field label="NPWZ lekarza">
            <input className={inputClass} value={doctorNpwz} onChange={e => setDoctorNpwz(e.target.value)} placeholder="1234567" maxLength={7} />
          </Field>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelClass.replace(' mb-1', '')}>Leki na recepcie</p>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                <Plus size={13} /> Dodaj lek
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="border border-neutral-100 rounded-lg p-3 space-y-2 bg-neutral-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-neutral-500">Pozycja {i + 1}</span>
                  <button type="button" onClick={() => removeItem(i)} className="text-neutral-400 hover:text-rose-500 transition-colors"><X size={14} /></button>
                </div>
                <MedSearch onSelect={m => setItemMed(i, m)} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelClass}>Ilość</label>
                    <input type="number" min={1} className={inputClass} value={item.quantity} onChange={e => setItemField(i, 'quantity', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelClass}>Dawkowanie</label>
                    <input className={inputClass} value={item.dosageInstructions} onChange={e => setItemField(i, 'dosageInstructions', e.target.value)} placeholder="2x dziennie" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="w-full h-11 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm">
            {saving ? 'Zapisywanie...' : 'Dodaj receptę'}
          </button>
        </form>

        {/* Lista recept */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col min-h-[400px]">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input className={inputClass + ' pl-9'} value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj po kodzie, pacjencie, statusie..." />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Brak recept" description="Dodaj pierwszą receptę za pomocą formularza obok." icon={<FileText size={40} />} />
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[70vh] pr-1">
              {filtered.map(p => (
                <div key={p.id} className="p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-neutral-900">#{p.accessCode}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? 'bg-neutral-100 text-neutral-500'}`}>{p.status}</span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">{p.patientName ?? '—'} <span className="text-neutral-400 font-mono">{p.patientPesel}</span></p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {p.issueDate ?? '—'} → {p.expirationDate ?? '—'} · {p.items.length} lek{p.items.length !== 1 ? 'i' : ''}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {editingStatusId === p.id ? (
                        <div className="flex items-center gap-1">
                          <select className="h-8 px-2 text-xs border border-neutral-200 rounded-lg bg-white" value={editingStatus} onChange={e => setEditingStatus(e.target.value)}>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button onClick={() => saveStatus(p.id)} className="h-8 px-2 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700 transition-colors">OK</button>
                          <button onClick={() => setEditingStatusId(null)} className="h-8 px-2 text-neutral-500 hover:text-rose-500 transition-colors"><X size={14} /></button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingStatusId(p.id); setEditingStatus(p.status); }}
                          className="flex items-center gap-1 h-8 px-2.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-colors"
                        >
                          <ChevronDown size={13} /> Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Nearby pharmacies tab ──────────────────────────────────────────────────

const NearbyTab = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadNearby = async () => {
    setIsLocating(true); setError('');
    try {
      const pos = await getUserLocation();
      setUserLocation(pos);
      setSearched(true); setSelectedId(null); setIsLoading(true);
      try { setPharmacies(await fetchNearbyByLocation(pos.lat, pos.lng, 12, 500)); }
      finally { setIsLoading(false); }
    } catch {
      setError('Nie udało się pobrać lokalizacji — udziel zgody w przeglądarce lub wyszukaj po mieście.');
    } finally { setIsLocating(false); }
  };

  const handleCitySearch = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setError(''); setSearched(true); setSelectedId(null); setUserLocation(null); setIsLoading(true);
    try { setPharmacies(await searchPharmacies(trimmed)); }
    catch { setError('Nie udało się wyszukać aptek'); }
    finally { setIsLoading(false); }
  };

  const withDistance = useMemo(() => {
    if (!userLocation) return pharmacies;
    return pharmacies
      .map(p => p.latitude != null && p.longitude != null
        ? { ...p, distance: haversineKm(userLocation, { lat: p.latitude, lng: p.longitude }) }
        : p)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [pharmacies, userLocation]);

  const handleSelect = (id: string) => setSelectedId(prev => (prev === id ? null : id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={loadNearby}
          disabled={isLocating}
          className="flex items-center justify-center gap-2 h-10 px-4 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors shadow-sm shrink-0"
        >
          <Crosshair size={16} />
          {isLocating ? 'Lokalizowanie...' : 'Użyj mojej lokalizacji'}
        </button>
        <form onSubmit={handleCitySearch} className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className={inputClass + ' pl-9'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Szukaj aptek po mieście..."
          />
        </form>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      {searched && !isLoading && withDistance.length > 0 && (
        <p className="text-xs text-neutral-400">
          Znaleziono {withDistance.length} aptek{userLocation ? ' — posortowano od najbliższej' : ''}
        </p>
      )}

      <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-320px)] lg:min-h-[400px]">
        <PharmacyMapView
          pharmacies={withDistance}
          selectedId={selectedId}
          onSelect={handleSelect}
          userLocation={userLocation}
          className="h-[48dvh] min-h-[260px] lg:h-auto lg:min-h-0 lg:flex-1 rounded-xl"
        />

        <div className="h-[32dvh] min-h-[180px] overflow-y-auto overscroll-contain space-y-3 pb-2 lg:h-auto lg:w-80 lg:pr-1 scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : !searched ? (
            <EmptyState
              title="Znajdź najbliższe apteki"
              description="Użyj swojej lokalizacji lub wyszukaj apteki po nazwie miasta."
              icon={<MapPin size={40} />}
            />
          ) : withDistance.length === 0 ? (
            <EmptyState
              title="Nie znaleziono aptek"
              description="Spróbuj wyszukać w innym mieście lub udostępnić lokalizację."
              icon={<MapPin size={40} />}
            />
          ) : (
            withDistance.map(p => (
              <PharmacyCard
                key={p.id}
                pharmacy={p}
                selected={selectedId === p.id}
                onClick={() => handleSelect(p.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'pharmacies' | 'prescriptions' | 'nearby';

const AdminPage = () => {
  const [tab, setTab] = useState<Tab>('pharmacies');

  return (
    <AppLayout title="Panel administratora" subtitle="Zarządzanie systemem">
      <div className="max-w-6xl space-y-6">
        <div className="flex gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab('pharmacies')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'pharmacies' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            <Building2 size={16} /> Apteki
          </button>
          <button
            onClick={() => setTab('prescriptions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'prescriptions' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            <FileText size={16} /> Recepty
          </button>
          <button
            onClick={() => setTab('nearby')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'nearby' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            <MapPin size={16} /> Najbliższe apteki
          </button>
        </div>

        {tab === 'pharmacies' ? <PharmacyTab /> : tab === 'prescriptions' ? <PrescriptionsTab /> : <NearbyTab />}
      </div>
    </AppLayout>
  );
};

export default AdminPage;
