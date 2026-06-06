package pl.j4ndean.finderbackend.model;

import java.time.LocalDate;
import java.util.Arrays;

public enum PrescriptionStatus {
    AKTYWNA("Aktywna", "ACTIVE"),
    CZĘŚCIOWO_ZREALIZOWANA("Częściowo zrealizowana", "ACTIVE"),
    NIEZREALIZOWANA("Niezrealizowana", "ACTIVE"),
    ZREALIZOWANA("Zrealizowana", "ARCHIVED"),
    ARCHIWALNA("Archiwalna", "ARCHIVED"),
    ANULOWANA("Anulowana", "ARCHIVED");

    public final String label;
    public final String category;

    PrescriptionStatus(String label, String category) {
        this.label = label;
        this.category = category;
    }

    public static PrescriptionStatus from(String code) {
        return Arrays.stream(values())
                .filter(s -> s.name().equals(code))
                .findFirst()
                .orElse(ARCHIWALNA);
    }

    public PrescriptionStatus effective(LocalDate expirationDate) {
        if ((this == AKTYWNA || this == CZĘŚCIOWO_ZREALIZOWANA)
                && expirationDate != null
                && LocalDate.now().isAfter(expirationDate)) {
            return NIEZREALIZOWANA;
        }
        return this;
    }
}
