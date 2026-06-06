package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.*;
import pl.j4ndean.finderbackend.repository.*;
import pl.j4ndean.finderbackend.service.PharmacyService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Panel administracyjny — zarządzanie aptekami (WF-11, WF-12) i receptami.
 * Dostęp wyłącznie dla użytkowników z rolą ADMIN (patrz SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PharmacyService pharmacyService;
    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final UserRepository userRepository;
    private final MedicationRepository medicationRepository;

    // ─── Apteki ───────────────────────────────────────────────────────────────

    @GetMapping("/pharmacies")
    public List<Pharmacy> getAllPharmacies() {
        return pharmacyService.getAllPharmacies();
    }

    @PostMapping("/pharmacies")
    public ResponseEntity<Pharmacy> createPharmacy(@RequestBody Pharmacy pharmacy) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pharmacyService.createPharmacy(pharmacy));
    }

    @PutMapping("/pharmacies/{id}")
    public Pharmacy updatePharmacy(@PathVariable Long id, @RequestBody Pharmacy pharmacy) {
        return pharmacyService.updatePharmacy(id, pharmacy);
    }

    // ─── Recepty ──────────────────────────────────────────────────────────────

    public record AdminPrescriptionDto(
        Long id, String accessCode, String issueDate, String expirationDate,
        String status, String patientPesel, String patientName, Long patientId,
        List<AdminItemDto> items
    ) {}

    public record AdminItemDto(
        Long id, Long medicationId, String medicationName, String strength,
        Integer quantity, String dosageInstructions, String status
    ) {}

    public record CreatePrescriptionRequest(
        Long patientId, String accessCode, String issueDate, String expirationDate,
        String doctorNpwz, String clinicRegon, String status, List<CreateItemRequest> items
    ) {
        public record CreateItemRequest(Long medicationId, Integer quantity, String dosageInstructions) {}
    }

    public record AdminUserDto(Long id, String firstName, String lastName, String email, String pesel) {}
    public record AdminMedicationDto(Long id, String name, String strength, String pharmaceuticalForm) {}

    @GetMapping("/prescriptions")
    @Transactional(readOnly = true)
    public List<AdminPrescriptionDto> getAllPrescriptions() {
        return prescriptionRepository.findAllWithPatient().stream()
            .map(p -> toDto(p, prescriptionItemRepository.findByPrescriptionId(p.getId())))
            .toList();
    }

    @PostMapping("/prescriptions")
    @Transactional
    public ResponseEntity<AdminPrescriptionDto> createPrescription(@RequestBody CreatePrescriptionRequest req) {
        var patient = userRepository.findById(req.patientId())
            .orElseThrow(() -> new RuntimeException("Patient not found"));

        var prescription = new Prescription();
        prescription.setPatient(patient);
        prescription.setAccessCode(req.accessCode());
        prescription.setIssueDate(req.issueDate() != null ? LocalDate.parse(req.issueDate()) : LocalDate.now());
        prescription.setExpirationDate(req.expirationDate() != null ? LocalDate.parse(req.expirationDate()) : LocalDate.now().plusDays(30));
        prescription.setDoctorNpwz(req.doctorNpwz());
        prescription.setClinicRegon(req.clinicRegon());
        prescription.setStatus(req.status() != null ? req.status() : "AKTYWNA");
        var saved = prescriptionRepository.save(prescription);

        var savedItems = new ArrayList<PrescriptionItem>();
        if (req.items() != null) {
            for (int i = 0; i < req.items().size(); i++) {
                var itemReq = req.items().get(i);
                var med = medicationRepository.findById(itemReq.medicationId())
                    .orElseThrow(() -> new RuntimeException("Medication not found"));
                var item = new PrescriptionItem();
                item.setPrescription(saved);
                item.setMedication(med);
                item.setQuantity(itemReq.quantity());
                item.setDosageInstructions(itemReq.dosageInstructions());
                item.setPositionInPackage(i + 1);
                item.setStatus("NIEZREALIZOWANY");
                savedItems.add(prescriptionItemRepository.save(item));
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved, savedItems));
    }

    @PutMapping("/prescriptions/{id}/status")
    @Transactional
    public AdminPrescriptionDto updatePrescriptionStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        var prescription = prescriptionRepository.findByIdWithPatient(id)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));
        prescription.setStatus(body.get("status"));
        prescriptionRepository.save(prescription);
        return toDto(prescription, prescriptionItemRepository.findByPrescriptionId(id));
    }

    @GetMapping("/users")
    public List<AdminUserDto> getUsers() {
        return userRepository.findAll().stream()
            .map(u -> new AdminUserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPesel()))
            .toList();
    }

    @GetMapping("/medications")
    public List<AdminMedicationDto> searchMedications(@RequestParam(defaultValue = "") String q) {
        var meds = q.isBlank()
            ? medicationRepository.findAll().stream().limit(30).toList()
            : medicationRepository.findTop30ByNameContainingIgnoreCaseOrderByNameAsc(q);
        return meds.stream()
            .map(m -> new AdminMedicationDto(m.getId(), m.getName(), m.getStrength(), m.getPharmaceuticalForm()))
            .toList();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private AdminPrescriptionDto toDto(Prescription p, List<PrescriptionItem> items) {
        String pesel = p.getPatient() != null ? p.getPatient().getPesel() : null;
        String name = p.getPatient() != null
            ? p.getPatient().getFirstName() + " " + p.getPatient().getLastName() : null;
        Long patientId = p.getPatient() != null ? p.getPatient().getId() : null;
        var itemDtos = items.stream().map(i -> new AdminItemDto(
            i.getId(), i.getMedication().getId(), i.getMedication().getName(),
            i.getMedication().getStrength(), i.getQuantity(), i.getDosageInstructions(), i.getStatus()
        )).toList();
        return new AdminPrescriptionDto(
            p.getId(), p.getAccessCode(),
            p.getIssueDate() != null ? p.getIssueDate().toString() : null,
            p.getExpirationDate() != null ? p.getExpirationDate().toString() : null,
            p.getStatus(), pesel, name, patientId, itemDtos
        );
    }
}
