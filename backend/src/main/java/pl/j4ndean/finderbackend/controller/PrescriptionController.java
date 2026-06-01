package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Medication;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.model.PharmacyInventory;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import static java.util.stream.Collectors.groupingBy;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionRepository prescriptions;
    private final PrescriptionItemRepository items;
    private final PharmacyInventoryRepository inventory;

    // --- DTOs ---
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

    // --- Endpoints ---
    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<PrescriptionDto> getMine(Authentication auth) {
        return prescriptions.findByPatientId(Long.valueOf(auth.getName())).stream()
                .map(p -> PrescriptionDto.from(p, items.findByPrescriptionId(p.getId()))).toList();
    }

    @GetMapping("/detail/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id, Authentication auth) {
        return prescriptions.findByIdWithPatient(id)
                .filter(p -> p.getPatient() != null && Long.valueOf(auth.getName()).equals(p.getPatient().getId()))
                .map(p -> ResponseEntity.ok(PrescriptionDto.from(p, items.findByPrescriptionId(p.getId()))))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{prescriptionId}/pharmacies")
    @Transactional(readOnly = true)
    public List<PharmacyAvailabilityDto> getPharmacies(@PathVariable Long prescriptionId) {
        var medicationIds = items.findByPrescriptionId(prescriptionId).stream().map(i -> i.getMedication().getId()).toList();
        if (medicationIds.isEmpty()) return List.of();

        return inventory.findByMedicationIds(medicationIds).stream()
                .collect(groupingBy(PharmacyInventory::getPharmacy))
                .entrySet().stream()
                .map(e -> PharmacyAvailabilityDto.from(e.getKey(), e.getValue().stream()
                    .map(i -> new PharmacyAvailabilityDto.AvailableMedicationDto(i.getMedication().getId(), i.getMedication().getName(), i.getStockQuantity())).toList()))
                .sorted(Comparator.comparingInt((PharmacyAvailabilityDto d) -> d.availableMedications().size()).reversed())
                .toList();
    }
}
