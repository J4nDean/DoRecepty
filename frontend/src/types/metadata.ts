export interface EnumOption {
  code: string;
  label: string;
  category?: string | null;
}

export interface AppMetadata {
  prescriptionStatuses:           EnumOption[];
  drugRealizationStatuses:        EnumOption[];
  medicationAvailabilityStatuses: EnumOption[];
}
