package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class MockP1Service {

    private final PrescriptionRepository prescriptions;
    private final PrescriptionItemRepository items;


    @Transactional(readOnly = true)
    public List<Prescription> fetchPrescriptionsByPesel(String pesel) {
        if (pesel == null || pesel.isBlank()) return List.of();
        return prescriptions.findByPatientPesel(pesel);
    }


    @Transactional(readOnly = true)
    public Optional<Prescription> fetchPrescriptionByPesel(String pesel, Long prescriptionId) {
        if (pesel == null || pesel.isBlank()) return Optional.empty();
        return prescriptions.findByIdWithPatient(prescriptionId)
                .filter(p -> p.getPatient() != null && pesel.equals(p.getPatient().getPesel()));
    }


    @Transactional(readOnly = true)
    public List<PrescriptionItem> fetchItems(Long prescriptionId) {
        return items.findByPrescriptionId(prescriptionId);
    }
}
