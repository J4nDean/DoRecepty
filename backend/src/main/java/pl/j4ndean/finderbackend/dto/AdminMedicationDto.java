package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.Medication;

public record AdminMedicationDto(Long id, String name, String strength, String pharmaceuticalForm) {
    public static AdminMedicationDto from(Medication m) {
        return new AdminMedicationDto(m.getId(), m.getName(), m.getStrength(), m.getPharmaceuticalForm());
    }
}
