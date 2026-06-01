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
