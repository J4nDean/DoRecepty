package pl.j4ndean.finderbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.j4ndean.finderbackend.model.DrugRealizationStatus;
import pl.j4ndean.finderbackend.model.MedicationAvailabilityStatus;
import pl.j4ndean.finderbackend.model.PrescriptionStatus;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    public record EnumOption(String code, String label, String category) {}

    public record AppMetadata(
        List<EnumOption> prescriptionStatuses,
        List<EnumOption> drugRealizationStatuses,
        List<EnumOption> medicationAvailabilityStatuses
    ) {}

    private static final AppMetadata METADATA = new AppMetadata(
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

    @GetMapping
    public AppMetadata getAll() {
        return METADATA;
    }
}
