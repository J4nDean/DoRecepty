export type DrugAvailabilityStatus =
  | 'DOSTĘPNY'
  | 'NIEDOSTĘPNY'
  | 'CZĘŚCIOWO_DOSTĘPNY';

export interface DrugAvailability {
  drugId: string;
  drugName: string;
  isAvailable: boolean;
  quantityInStock?: number;
  status: DrugAvailabilityStatus;
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
  availableDrugs?: DrugAvailability[];
}
