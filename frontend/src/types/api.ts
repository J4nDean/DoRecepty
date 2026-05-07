/* Raw shapes returned by the backend — used only in service layer for mapping */

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
  status: string | null;
  latitude: number | null;
  longitude: number | null;
}
