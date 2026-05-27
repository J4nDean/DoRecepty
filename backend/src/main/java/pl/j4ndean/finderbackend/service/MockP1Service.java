package pl.j4ndean.finderbackend.service;

import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Medication;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;

import java.time.LocalDate;
import java.util.List;

/**
 * Tymczasowy mock systemu P1 — zwraca przykładowe recepty bez połączenia z DB.
 * Docelowo zastąpiony przez integrację z HL7 FHIR / P1 API.
 */
@Service
public class MockP1Service {

    public List<Prescription> getPrescriptionsByPesel(String pesel) {
        Medication amotaks = Medication.builder()
                .name("Amotaks")
                .commonName("Amoxicillinum")
                .strength("500 mg")
                .pharmaceuticalForm("Kapsułki twarde")
                .packageSize("16 kaps.")
                .atcCode("J01CA04")
                .prescriptionCategory("Rp")
                .build();

        Medication paracetamol = Medication.builder()
                .name("Apap")
                .commonName("Paracetamolum")
                .strength("500 mg")
                .pharmaceuticalForm("Tabletki powlekane")
                .packageSize("10 tabl.")
                .atcCode("N02BE01")
                .prescriptionCategory("OTC")
                .build();

        Medication ibuprofen = Medication.builder()
                .name("Ibuprom RR")
                .commonName("Ibuprofenum")
                .strength("400 mg")
                .pharmaceuticalForm("Tabletki powlekane")
                .packageSize("24 tabl.")
                .atcCode("M01AE01")
                .prescriptionCategory("OTC")
                .build();

        Prescription active = Prescription.builder()
                .id("RP-MOCK-ACTIVE-000000001-" + pesel.substring(0, Math.min(6, pesel.length())))
                .accessCode("1234")
                .issueDate(LocalDate.now().minusDays(3))
                .expirationDate(LocalDate.now().plusDays(27))
                .doctorNpwz("1234567")
                .clinicRegon("12345678")
                .status("ACTIVE")
                .build();

        Prescription realized = Prescription.builder()
                .id("RP-MOCK-REALIZED-000000002-" + pesel.substring(0, Math.min(6, pesel.length())))
                .accessCode("5678")
                .issueDate(LocalDate.now().minusDays(30))
                .expirationDate(LocalDate.now().minusDays(3))
                .doctorNpwz("7654321")
                .clinicRegon("87654321")
                .status("REALIZED")
                .build();

        return List.of(active, realized);
    }
}
