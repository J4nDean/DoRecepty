package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto.AvailableMedicationDto;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.model.Medication;
import pl.j4ndean.finderbackend.model.PharmacyInventory;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.util.Comparator;
import java.util.List;

/**
 * Recepty pacjenta (mock systemu P1). Logika jest tu bezpośrednio w kontrolerze —
 * to tylko odczyt z repozytoriów i złożenie odpowiedzi (DTO).
 */
@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionRepository prescriptions;
    private final PrescriptionItemRepository items;
    private final PharmacyInventoryRepository inventory;

    /** Recepty zalogowanego użytkownika — właściciel brany z tokenu JWT, nie z URL-a. */
    @GetMapping("/me")
    @Transactional(readOnly = true)
    public List<PrescriptionDto> getMine(Authentication auth) {
        return prescriptions.findByPatientId(currentUserId(auth)).stream()
                .map(this::toDto)
                .toList();
    }

    /** Szczegóły recepty — tylko jeśli należy do zalogowanego użytkownika. */
    @GetMapping("/detail/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id, Authentication auth) {
        Long userId = currentUserId(auth);
        return prescriptions.findByIdWithPatient(id)
                .filter(p -> p.getPatient() != null && userId.equals(p.getPatient().getId()))
                .map(p -> ResponseEntity.ok(toDto(p)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Apteki, w których dostępne są leki z danej recepty (posortowane po liczbie dostępnych pozycji). */
    @GetMapping("/{prescriptionId}/pharmacies")
    @Transactional(readOnly = true)
    public List<PharmacyAvailabilityDto> getPharmacies(@PathVariable Long prescriptionId) {
        if (!prescriptions.existsById(prescriptionId)) return List.of();

        List<Long> medicationIds = items.findByPrescriptionId(prescriptionId).stream()
                .map(PrescriptionItem::getMedication)
                .map(Medication::getId)
                .toList();
        if (medicationIds.isEmpty()) return List.of();

        return inventory.findByMedicationIds(medicationIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(PharmacyInventory::getPharmacy))
                .entrySet().stream()
                .map(e -> PharmacyAvailabilityDto.from(e.getKey(), toMedDtos(e.getValue())))
                .sorted(Comparator.comparingInt((PharmacyAvailabilityDto d) -> d.availableMedications().size()).reversed())
                .toList();
    }

    private PrescriptionDto toDto(Prescription p) {
        return PrescriptionDto.from(p, items.findByPrescriptionId(p.getId()));
    }

    private static List<AvailableMedicationDto> toMedDtos(List<PharmacyInventory> inv) {
        return inv.stream()
                .map(i -> new AvailableMedicationDto(
                        i.getMedication().getId(),
                        i.getMedication().getName(),
                        i.getStockQuantity()))
                .toList();
    }

    /** Id użytkownika ustawione przez JwtAuthFilter jako principal (subject tokenu). */
    private static Long currentUserId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
