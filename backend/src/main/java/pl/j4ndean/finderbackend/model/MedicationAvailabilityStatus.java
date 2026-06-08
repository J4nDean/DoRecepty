package pl.j4ndean.finderbackend.model;

public enum MedicationAvailabilityStatus {
    DOSTĘPNY("✓ Dostępny"),
    NIEDOSTĘPNY("✕ Brak");

    public final String label;

    MedicationAvailabilityStatus(String label) {
        this.label = label;
    }
}
