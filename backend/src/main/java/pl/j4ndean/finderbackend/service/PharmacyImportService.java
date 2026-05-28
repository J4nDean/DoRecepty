package pl.j4ndean.finderbackend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.repository.MedicationRepository;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import javax.sql.DataSource;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Ładuje dane początkowe (seed) z classpath:/db/seed/*.sql przy starcie aplikacji.
 * Pliki uruchamiane są w kolejności alfabetycznej (stąd prefiks 01_, 02_…),
 * ale tylko gdy odpowiadające im tabele są puste — bezpieczne przy każdym restarcie.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyImportService {

    private static final String SEED_LOCATION = "classpath:db/seed/*.sql";

    private final DataSource dataSource;
    private final PharmacyRepository pharmacyRepository;
    private final MedicationRepository medicationRepository;

    @PostConstruct
    public void init() {
        if (pharmacyRepository.count() > 0 && medicationRepository.count() > 0) {
            log.info("Seed tables already populated — skipping import");
            return;
        }

        Resource[] scripts;
        try {
            scripts = new PathMatchingResourcePatternResolver().getResources(SEED_LOCATION);
        } catch (Exception e) {
            log.warn("No seed scripts found at {}: {}", SEED_LOCATION, e.getMessage());
            return;
        }

        Arrays.sort(scripts, Comparator.comparing(Resource::getFilename));
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator(scripts);
        populator.setSeparator(";");
        populator.setSqlScriptEncoding("UTF-8");
        populator.execute(dataSource);

        log.info("Seed import complete. Pharmacies: {}, Medications: {}",
                pharmacyRepository.count(), medicationRepository.count());
    }
}
