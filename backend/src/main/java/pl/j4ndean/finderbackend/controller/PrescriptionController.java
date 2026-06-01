package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.service.PrescriptionService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    // --- DTOs (Zostają tutaj dla kontraktu API, ale mapowanie wykonuje Serwis) ---
    public record PrescriptionDto(
        Long id, String accessCode, LocalDate issueDate, LocalDate expirationDate,
        String doctorNpwz, String clinicRegon, String status, PatientDto patient, List<ItemDto> items
    ) {
        public record PatientDto(Long id, String pesel) {}
        public record ItemDto(Long id, String prescriptionOid, Integer positionInPackage, MedicationDto medication, Integer quantity, String dosageInstructions, String status) {}
        public record MedicationDto(Long id, String name, String commonName, String strength, String pharmaceuticalForm, String packageSize) {}

        public static PrescriptionDto from(Prescription p, List<PrescriptionItem> items) {
            var patient = p.getPatient() != null ? new PatientDto(p.getPatient().getId(), p.getPatient().getPesel()) : null;
            var itemDtos = items.stream().map(i -> {
                var m = i.getMedication();
                return new ItemDto(i.getId(), i.getPrescriptionOid(), i.getPositionInPackage(),
                    new MedicationDto(m.getId(), m.getName(), m.getCommonName(), m.getStrength(), m.getPharmaceuticalForm(), m.getPackageSize()),
                    i.getQuantity(), i.getDosageInstructions(), i.getStatus());
            }).toList();
            return new PrescriptionDto(p.getId(), p.getAccessCode(), p.getIssueDate(), p.getExpirationDate(), p.getDoctorNpwz(), p.getClinicRegon(), p.getStatus(), patient, itemDtos);
        }
    }

    public record PharmacyAvailabilityDto(Long id, String name, String address, String city, String phone, Double latitude, Double longitude, String status, String openingHoursWeekdays, String openingHoursSaturday, String openingHoursSunday, List<AvailableMedicationDto> availableMedications) {
        public record AvailableMedicationDto(Long medicationId, String medicationName, Integer stockQuantity) {}
        public static PharmacyAvailabilityDto from(Pharmacy p, List<AvailableMedicationDto> meds) {
            return new PharmacyAvailabilityDto(p.getId(), p.getName(), p.getAddress(), p.getCity(), p.getPhone(), p.getLatitude(), p.getLongitude(), p.getStatus(), p.getOpeningHoursWeekdays(), p.getOpeningHoursSaturday(), p.getOpeningHoursSunday(), meds);
        }
    }

    // --- Endpoints (Cienkie metody wywołujące serwis) ---
    @GetMapping("/me")
    public List<PrescriptionDto> getMine(Authentication auth) {
        return prescriptionService.getUserPrescriptions(Long.valueOf(auth.getName()));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionDetail(id, Long.valueOf(auth.getName())));
    }

    @GetMapping("/{prescriptionId}/pharmacies")
    public List<PharmacyAvailabilityDto> getPharmacies(@PathVariable Long prescriptionId) {
        return prescriptionService.getPharmacyAvailability(prescriptionId);
    }
}
