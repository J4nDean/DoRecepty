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
}

export interface Prescription {
  id: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: PrescriptionStatus;
  doctorName: string;
  doctorSpecialty: string;
  patientPesel: string;
  drugs: Drug[];
  notes?: string;
}
