export type MedicationAvailabilityStatus =
  | 'DOSTĘPNY'
  | 'NIEDOSTĘPNY'
  | 'CZĘŚCIOWO_DOSTĘPNY';

export interface MedicationAvailability {
  medicationId: string;
  medicationName: string;
  isAvailable: boolean;
  quantityInStock?: number;
  status: MedicationAvailabilityStatus;
}

export interface OpeningHours {
  weekdays: string;
  saturday: string;
  sunday: string;
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
}
