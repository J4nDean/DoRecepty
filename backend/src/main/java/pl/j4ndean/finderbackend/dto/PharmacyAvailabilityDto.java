package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.Pharmacy;

import java.util.List;

public record PharmacyAvailabilityDto(
    Long id,
    String name,
    String address,
    String city,
    String postalCode,
    String phone,
    String status,
    String openingHoursWeekdays,
    String openingHoursSaturday,
    String openingHoursSunday,
    Double latitude,
    Double longitude,
    List<AvailableMedicationDto> availableMedications
) {
    public record AvailableMedicationDto(
        Long medicationId,
        String medicationName,
        Integer stockQuantity
    ) {}

    public static PharmacyAvailabilityDto from(Pharmacy ph, List<AvailableMedicationDto> meds) {
        return new PharmacyAvailabilityDto(
            ph.getId(), ph.getName(), ph.getAddress(), ph.getCity(),
            ph.getPostalCode(), ph.getPhone(), ph.getStatus(),
            ph.getOpeningHoursWeekdays(), ph.getOpeningHoursSaturday(), ph.getOpeningHoursSunday(),
            ph.getLatitude(), ph.getLongitude(),
            meds
        );
    }
}
