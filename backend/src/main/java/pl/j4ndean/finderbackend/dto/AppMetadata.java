package pl.j4ndean.finderbackend.dto;

import java.util.List;

public record AppMetadata(
        List<EnumOption> prescriptionStatuses,
        List<EnumOption> drugRealizationStatuses,
        List<EnumOption> medicationAvailabilityStatuses
) {}
