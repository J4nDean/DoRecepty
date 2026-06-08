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

/**
 * Symulator zewnętrznego systemu P1 (Centrum e-Zdrowia).
 * <p>
 * Stanowi granicę między infrastrukturą własną aplikacji a autorytatywnym źródłem
 * danych o e-receptach. W docelowym środowisku produkcyjnym recepty pobierane byłyby
 * z zewnętrznego API platformy P1 na podstawie numeru PESEL pacjenta; tutaj dane te
 * zwracane są z lokalnej bazy zasilonej predefiniowanym zestawem recept. Dzięki
 * odizolowaniu tej logiki zastąpienie mocka realnym wywołaniem P1 wymaga zmiany
 * wyłącznie tego komponentu, bez ingerencji w pozostałe warstwy systemu.
 */
@Service
@RequiredArgsConstructor
public class MockP1Service {

    private final PrescriptionRepository prescriptions;
    private final PrescriptionItemRepository items;

    /** Pobiera wszystkie pakiety e-recept pacjenta o podanym numerze PESEL. */
    @Transactional(readOnly = true)
    public List<Prescription> fetchPrescriptionsByPesel(String pesel) {
        if (pesel == null || pesel.isBlank()) return List.of();
        return prescriptions.findByPatientPesel(pesel);
    }

    /** Pobiera pojedynczą e-receptę, o ile należy do pacjenta o podanym numerze PESEL. */
    @Transactional(readOnly = true)
    public Optional<Prescription> fetchPrescriptionByPesel(String pesel, Long prescriptionId) {
        if (pesel == null || pesel.isBlank()) return Optional.empty();
        return prescriptions.findByIdWithPatient(prescriptionId)
                .filter(p -> p.getPatient() != null && pesel.equals(p.getPatient().getPesel()));
    }

    /** Zwraca pozycje leków wchodzące w skład danej e-recepty. */
    @Transactional(readOnly = true)
    public List<PrescriptionItem> fetchItems(Long prescriptionId) {
        return items.findByPrescriptionId(prescriptionId);
    }
}
