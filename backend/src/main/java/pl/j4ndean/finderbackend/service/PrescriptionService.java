package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.j4ndean.finderbackend.controller.PrescriptionController.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.controller.PrescriptionController.PrescriptionDto;
import pl.j4ndean.finderbackend.model.PharmacyInventory;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.util.Comparator;
import java.util.List;
import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptions;
    private final PrescriptionItemRepository items;
    private final PharmacyInventoryRepository inventory;

    @Transactional(readOnly = true)
    public List<PrescriptionDto> getUserPrescriptions(Long userId) {
        return prescriptions.findByPatientId(userId).stream()
                .map(p -> PrescriptionDto.from(p, items.findByPrescriptionId(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PrescriptionDto getPrescriptionDetail(Long prescriptionId, Long userId) {
        return prescriptions.findByIdWithPatient(prescriptionId)
                .filter(p -> p.getPatient() != null && userId.equals(p.getPatient().getId()))
                .map(p -> PrescriptionDto.from(p, items.findByPrescriptionId(p.getId())))
                .orElseThrow(() -> new RuntimeException("Prescription not found or access denied"));
    }

    @Transactional(readOnly = true)
    public List<PharmacyAvailabilityDto> getPharmacyAvailability(Long prescriptionId) {
        var medicationIds = items.findByPrescriptionId(prescriptionId).stream()
                .map(i -> i.getMedication().getId())
                .toList();
        
        if (medicationIds.isEmpty()) return List.of();

        return inventory.findByMedicationIds(medicationIds).stream()
                .collect(groupingBy(PharmacyInventory::getPharmacy))
                .entrySet().stream()
                .map(e -> PharmacyAvailabilityDto.from(e.getKey(), e.getValue().stream()
                    .map(i -> new PharmacyAvailabilityDto.AvailableMedicationDto(
                        i.getMedication().getId(), 
                        i.getMedication().getName(), 
                        i.getStockQuantity()))
                    .toList()))
                .sorted(Comparator.comparingInt((PharmacyAvailabilityDto d) -> d.availableMedications().size()).reversed())
                .limit(2000)
                .toList();
    }
}
