package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.DrugRealizationStatus;
import pl.j4ndean.finderbackend.model.MedicationAvailabilityStatus;
import pl.j4ndean.finderbackend.model.PrescriptionStatus;

import java.util.Arrays;
import java.util.List;

public record AppMetadata(
    List<EnumOption> prescriptionStatuses,
    List<EnumOption> drugRealizationStatuses,
    List<EnumOption> medicationAvailabilityStatuses
) {
    public static AppMetadata build() {
        return new AppMetadata(
            Arrays.stream(PrescriptionStatus.values())
                .map(s -> new EnumOption(s.name(), s.label, s.category))
                .toList(),
            Arrays.stream(DrugRealizationStatus.values())
                .map(s -> new EnumOption(s.name(), s.label, null))
                .toList(),
            Arrays.stream(MedicationAvailabilityStatus.values())
                .map(s -> new EnumOption(s.name(), s.label, null))
                .toList()
        );
    }
}
