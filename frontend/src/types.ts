// Wszystkie typy aplikacji w jednym miejscu.
// Sekcja 1: modele używane w UI. Sekcja 2: surowe kształty odpowiedzi z API.

// ---------- Użytkownik / autoryzacja ----------

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  pesel: string;
  password: string;
  confirmPassword: string;
}

// ---------- Recepty ----------

export type PrescriptionStatus =
  | 'AKTYWNA'
  | 'CZĘŚCIOWO_ZREALIZOWANA'
  | 'ZREALIZOWANA'
  | 'ARCHIWALNA'
  | 'ANULOWANA';

export type DrugRealizationStatus = 'ZREALIZOWANY' | 'NIEZREALIZOWANY' | 'CZĘŚCIOWO';

export interface Drug {
  id: string;
  name: string;
  dosage: string;
  quantity: number;
  unit: string;
  realizationStatus: DrugRealizationStatus;
  oid?: string;
}

export interface Prescription {
  id: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: PrescriptionStatus;
  doctorName: string;
  doctorSpecialty: string;
  doctorNpwz?: string;
  clinicRegon?: string;
  patientPesel: string;
  drugs: Drug[];
  notes?: string;
}

// ---------- Apteki ----------

export type MedicationAvailabilityStatus = 'DOSTĘPNY' | 'NIEDOSTĘPNY' | 'CZĘŚCIOWO_DOSTĘPNY';

export interface MedicationAvailability {
  medicationId: string;
  medicationName: string;
  isAvailable: boolean;
  quantityInStock?: number;
  status: MedicationAvailabilityStatus;
}

export interface OpeningHours {
  weekdays: string | null;
  saturday: string | null;
  sunday: string | null;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  distance?: number;
  openingHours: OpeningHours;
  isOpen: boolean;
  latitude?: number;
  longitude?: number;
  availableMedications?: MedicationAvailability[];
  hasPrescriptionMedications?: boolean;
  prescriptionAvailability?: 'FULL' | 'PARTIAL';
}

// ---------- Metadane (listy enumów z backendu) ----------

export interface EnumOption {
  code: string;
  label: string;
  category?: string | null;
}

export interface AppMetadata {
  prescriptionStatuses: EnumOption[];
  drugRealizationStatuses: EnumOption[];
  medicationAvailabilityStatuses: EnumOption[];
}

// ---------- Surowe odpowiedzi z API ----------

export interface ApiMedication {
  id: number | null;
  name: string;
  commonName: string | null;
  strength: string | null;
  pharmaceuticalForm: string | null;
  packageSize: string | null;
}

export interface ApiPrescriptionItem {
  id: number;
  prescriptionOid: string | null;
  positionInPackage: number | null;
  medication: ApiMedication;
  quantity: number | null;
  dosageInstructions: string | null;
  status: string;
}

export interface ApiPrescription {
  id: number;
  accessCode: string;
  issueDate: string | null;
  expirationDate: string | null;
  doctorNpwz: string | null;
  clinicRegon: string | null;
  status: string;
  patient: { id: number; pesel: string } | null;
  items: ApiPrescriptionItem[];
}

export interface ApiPharmacy {
  id: number;
  name: string;
  address: string;
  city: string;
  postalCode: string | null;
  phone: string | null;
  status: string | null;
  openingHoursWeekdays: string | null;
  openingHoursSaturday: string | null;
  openingHoursSunday: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ApiAvailableMedication {
  medicationId: number;
  medicationName: string;
  stockQuantity: number;
}

export interface ApiPharmacyAvailability extends ApiPharmacy {
  availableMedications: ApiAvailableMedication[];
}
