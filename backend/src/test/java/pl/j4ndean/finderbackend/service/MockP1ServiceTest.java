package pl.j4ndean.finderbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.repository.PrescriptionItemRepository;
import pl.j4ndean.finderbackend.repository.PrescriptionRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class MockP1ServiceTest {

    @Mock PrescriptionRepository prescriptions;
    @Mock PrescriptionItemRepository items;
    @InjectMocks MockP1Service service;

    @Test
    void receptyPoPesel_pozytywny_zwracaReceptyZRepozytorium() {
        when(prescriptions.findByPatientPesel("12345678901"))
                .thenReturn(List.of(new Prescription()));

        List<Prescription> result = service.fetchPrescriptionsByPesel("12345678901");

        assertThat(result).hasSize(1);
        verify(prescriptions).findByPatientPesel("12345678901");
    }

    @Test
    void receptyPoPesel_negatywny_zwracaPustaListeDlaPustegoPesel() {
        assertThat(service.fetchPrescriptionsByPesel(null)).isEmpty();
        assertThat(service.fetchPrescriptionsByPesel("   ")).isEmpty();
        verifyNoInteractions(prescriptions);
    }
}
