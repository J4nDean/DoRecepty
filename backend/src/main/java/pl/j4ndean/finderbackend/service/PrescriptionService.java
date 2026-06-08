package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.model.PharmacyInventory;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.Comparator;
import java.util.List;
import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final MockP1Service p1;
    private final UserRepository users;
    private final PharmacyInventoryRepository inventory;

    @Transactional(readOnly = true)
    public List<PrescriptionDto> getUserPrescriptions(Long userId) {
        String pesel = peselOf(userId);
        return p1.fetchPrescriptionsByPesel(pesel).stream()
                .map(p -> PrescriptionDto.from(p, p1.fetchItems(p.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public PrescriptionDto getPrescriptionDetail(Long prescriptionId, Long userId) {
        String pesel = peselOf(userId);
        return p1.fetchPrescriptionByPesel(pesel, prescriptionId)
                .map(p -> PrescriptionDto.from(p, p1.fetchItems(p.getId())))
                .orElseThrow(() -> new RuntimeException("Prescription not found or access denied"));
    }

    @Transactional(readOnly = true)
    public List<PharmacyAvailabilityDto> getPharmacyAvailability(Long prescriptionId) {
        var medicationIds = p1.fetchItems(prescriptionId).stream()
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

    private String peselOf(Long userId) {
        return users.findById(userId)
                .map(User::getPesel)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
