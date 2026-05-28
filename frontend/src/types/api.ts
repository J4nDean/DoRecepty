export interface ApiMedication {
  id: number | null;
  gtin: string | null;
  name: string;
  commonName: string | null;
  strength: string | null;
  pharmaceuticalForm: string | null;
  packageSize: string | null;
  atcCode: string | null;
  prescriptionCategory: string | null;
}

export interface ApiPrescription {
  id: string;
  accessCode: string;
  issueDate: string | null;
  expirationDate: string | null;
  doctorNpwz: string | null;
  clinicRegon: string | null;
  status: string;
  patient: { id: number; pesel: string } | null;
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
