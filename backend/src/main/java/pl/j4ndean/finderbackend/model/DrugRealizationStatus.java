package pl.j4ndean.finderbackend.model;

import java.util.Arrays;

public enum DrugRealizationStatus {
    NIEZREALIZOWANY("Niezrealizowany"),
    ZREALIZOWANY("Zrealizowany"),
    CZĘŚCIOWO("Częściowo");

    public final String label;

    DrugRealizationStatus(String label) {
        this.label = label;
    }

    public static DrugRealizationStatus from(String code) {
        return Arrays.stream(values())
                .filter(s -> s.name().equals(code))
                .findFirst()
                .orElse(NIEZREALIZOWANY);
    }
}
