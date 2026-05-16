export interface ApiDrug {
  id: number | null;
  name: string;
  quantity: string;
}

export interface ApiRecipe {
  id: number | null;
  accessCode: string;
  pesel: string;
  status: string;
  drugs: ApiDrug[];
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
