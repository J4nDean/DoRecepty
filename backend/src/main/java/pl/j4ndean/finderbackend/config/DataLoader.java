package pl.j4ndean.finderbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {
    private final PharmacyRepository pharmacyRepository;

    @Override
    public void run(String... args) {
        if (pharmacyRepository.count() == 0) {
            pharmacyRepository.saveAll(Arrays.asList(
                Pharmacy.builder().name("Apteka Słoneczna").address("ul. Marszałkowska 10").city("Warszawa").latitude(52.2297).longitude(21.0122).build(),
                Pharmacy.builder().name("Apteka pod Orłem").address("ul. Piotrkowska 50").city("Łódź").latitude(51.7592).longitude(19.4560).build(),
                Pharmacy.builder().name("Apteka Centralna").address("ul. Rynek Główny 1").city("Kraków").latitude(50.0647).longitude(19.9450).build()
            ));
        }
    }
}
