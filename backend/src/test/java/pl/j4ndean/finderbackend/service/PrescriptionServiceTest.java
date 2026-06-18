package pl.j4ndean.finderbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.PharmacyInventoryRepository;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class PrescriptionServiceTest {

    @Mock MockP1Service p1;
    @Mock UserRepository users;
    @Mock PharmacyInventoryRepository inventory;
    @InjectMocks PrescriptionService service;

    @Test
    void dostepDoRecepty_pozytywny_zwracaRecepteWlasciciela() {
        User user = User.builder().id(1L).pesel("12345678901").build();
        Prescription prescription = Prescription.builder().id(500L).build();
        when(users.findById(1L)).thenReturn(Optional.of(user));
        when(p1.fetchPrescriptionByPesel("12345678901", 500L)).thenReturn(Optional.of(prescription));
        when(p1.fetchItems(500L)).thenReturn(List.of());

        PrescriptionDto dto = service.getPrescriptionDetail(500L, 1L);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(500L);
    }

    @Test
    void dostepDoRecepty_negatywny_rzucaWyjatekDlaCudzejRecepty() {
        User user = User.builder().id(1L).pesel("12345678901").build();
        when(users.findById(1L)).thenReturn(Optional.of(user));

        when(p1.fetchPrescriptionByPesel("12345678901", 500L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getPrescriptionDetail(500L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }
}
