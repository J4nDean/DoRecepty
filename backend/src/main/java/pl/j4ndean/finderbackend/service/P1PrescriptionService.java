package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto.AvailableMedicationDto;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.model.Medication;
import pl.j4ndean.finderbackend.model.PharmacyInventory;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class P1PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionItemRepository prescriptionItemRepository;
    private final PharmacyInventoryRepository pharmacyInventoryRepository;

    public Optional<PrescriptionDto> getById(Long id) {
        return prescriptionRepository.findByIdWithPatient(id)
                .map(p -> PrescriptionDto.from(p, prescriptionItemRepository.findByPrescriptionId(p.getId())));
    }

    public List<PrescriptionDto> getByPesel(String pesel) {
        return prescriptionRepository.findByPatientPesel(pesel).stream()
                .map(p -> PrescriptionDto.from(p, prescriptionItemRepository.findByPrescriptionId(p.getId())))
                .toList();
    }

    public List<PharmacyAvailabilityDto> getPharmaciesForPrescription(Long prescriptionId) {
        if (!prescriptionRepository.existsById(prescriptionId)) return List.of();

        List<Long> medicationIds = prescriptionItemRepository.findByPrescriptionId(prescriptionId).stream()
                .map(PrescriptionItem::getMedication)
                .map(Medication::getId)
                .toList();

        if (medicationIds.isEmpty()) return List.of();

        return pharmacyInventoryRepository.findByMedicationIds(medicationIds).stream()
                .collect(Collectors.groupingBy(PharmacyInventory::getPharmacy))
                .entrySet().stream()
                .map(e -> PharmacyAvailabilityDto.from(e.getKey(), toMedDtos(e.getValue())))
                .sorted(Comparator.comparingInt((PharmacyAvailabilityDto d) -> d.availableMedications().size()).reversed())
                .toList();
    }

    private static List<AvailableMedicationDto> toMedDtos(List<PharmacyInventory> inventory) {
        return inventory.stream()
                .map(inv -> new AvailableMedicationDto(
                        inv.getMedication().getId(),
                        inv.getMedication().getName(),
                        inv.getStockQuantity()))
                .toList();
    }
}
