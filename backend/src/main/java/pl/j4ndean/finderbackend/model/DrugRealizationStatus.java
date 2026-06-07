package pl.j4ndean.finderbackend.model;

public enum DrugRealizationStatus {
    NIEZREALIZOWANY("Niezrealizowany"),
    ZREALIZOWANY("Zrealizowany"),
    CZĘŚCIOWO("Częściowo");

    public final String label;

    DrugRealizationStatus(String label) {
        this.label = label;
    }

    public static DrugRealizationStatus from(String code) {
        if (code == null) return NIEZREALIZOWANY;
        for (DrugRealizationStatus s : values()) {
            if (s.name().equals(code)) return s;
        }
        return switch (code) {
            case "REALIZED"           -> ZREALIZOWANY;
            case "PARTIALLY_REALIZED" -> CZĘŚCIOWO;
            default                   -> NIEZREALIZOWANY; // ACTIVE, CANCELLED, nieznane
        };
    }
}
