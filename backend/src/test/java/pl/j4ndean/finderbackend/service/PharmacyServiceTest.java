package pl.j4ndean.finderbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class PharmacyServiceTest {

    @Mock PharmacyRepository pharmacies;
    @InjectMocks PharmacyService service;

    @Test
    void aktualizacjaApteki_pozytywny_nadpisujeDaneIZachowujeId() {
        Pharmacy istniejaca = Pharmacy.builder().id(1L).name("Stara nazwa").city("Warszawa").build();
        Pharmacy zmiany = Pharmacy.builder().name("Nowa nazwa").city("Krakow").build();
        when(pharmacies.findById(1L)).thenReturn(Optional.of(istniejaca));
        when(pharmacies.save(any(Pharmacy.class))).thenAnswer(inv -> inv.getArgument(0));

        Pharmacy result = service.updatePharmacy(1L, zmiany);

        assertThat(result.getName()).isEqualTo("Nowa nazwa");
        assertThat(result.getCity()).isEqualTo("Krakow");
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    void aktualizacjaApteki_negatywny_rzuca404GdyAptekaNieIstnieje() {
        when(pharmacies.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updatePharmacy(404L, new Pharmacy()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Apteka nie istnieje");

        verify(pharmacies, never()).save(any());
    }
}
