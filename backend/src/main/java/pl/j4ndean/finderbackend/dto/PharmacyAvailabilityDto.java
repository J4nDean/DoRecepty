package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.Pharmacy;

import java.util.List;

public record PharmacyAvailabilityDto(Long id, String name, String address, String city, String phone, Double latitude, Double longitude, String status, String openingHoursWeekdays, String openingHoursSaturday, String openingHoursSunday, List<AvailableMedicationDto> availableMedications) {
    public record AvailableMedicationDto(Long medicationId, String medicationName, Integer stockQuantity) {}

    public static PharmacyAvailabilityDto from(Pharmacy p, List<AvailableMedicationDto> meds) {
        return new PharmacyAvailabilityDto(p.getId(), p.getName(), p.getAddress(), p.getCity(), p.getPhone(), p.getLatitude(), p.getLongitude(), p.getStatus(), p.getOpeningHoursWeekdays(), p.getOpeningHoursSaturday(), p.getOpeningHoursSunday(), meds);
    }
}
