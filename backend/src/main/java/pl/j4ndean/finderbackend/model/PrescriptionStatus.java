package pl.j4ndean.finderbackend.model;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
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

    private static final int TRANSITIONAL_DAYS = 30;

    public static PrescriptionStatus from(String code) {
        if (code == null) return ARCHIWALNA;
        for (PrescriptionStatus s : values()) {
            if (s.name().equals(code)) return s;
        }
        return switch (code) {
            case "ACTIVE"            -> AKTYWNA;
            case "PARTIALLY_REALIZED"-> CZĘŚCIOWO_ZREALIZOWANA;
            case "REALIZED"          -> ZREALIZOWANA;
            case "CANCELLED"         -> ANULOWANA;
            default                  -> ARCHIWALNA;
        };
    }

    public PrescriptionStatus effective(LocalDate expirationDate) {
        if (this == ANULOWANA || this == ZREALIZOWANA || this == ARCHIWALNA) {
            return this;
        }
        if (expirationDate != null && LocalDate.now().isAfter(expirationDate)) {
            long daysExpired = ChronoUnit.DAYS.between(expirationDate, LocalDate.now());
            return daysExpired <= TRANSITIONAL_DAYS ? NIEZREALIZOWANA : ARCHIWALNA;
        }
        return this;
    }
}
