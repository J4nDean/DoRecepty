package pl.j4ndean.finderbackend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyImportService {

    private static final String DEMO_PESEL    = "44051401458";
    private static final String DEMO_EMAIL    = "demo@dorecepty.pl";
    private static final String DEMO_PASSWORD = "Demo1234!";

    private final DataSource      dataSource;
    private final JdbcTemplate    jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        truncateAll();
        ensureDemoUser();
        runSeed("db/seed/01_pharmacies.sql");
        runSeed("db/seed/02_medications.sql");
        runSeed("db/seed/03_prescriptions.sql");
        runSeed("db/seed/04_pharmacy_inventory.sql");
    }

    /**
     * Czyści wszystkie tabele danych w poprawnej kolejności FK i resetuje sekwencje.
     * Nie dotyka tabeli app_user (demo-użytkownik musi przeżyć restart).
     */
    private void truncateAll() {
        jdbcTemplate.execute(
            "TRUNCATE prescription_item, pharmacy_inventory, user_favorite_pharmacy, " +
            "prescription, medication, pharmacy RESTART IDENTITY"
        );
        log.info("Wszystkie tabele danych zostały wyczyszczone");
    }

    /**
     * Tworzy demo-użytkownika z id=1 (patient_id w seedach recept), jeśli nie istnieje.
     */
    private void ensureDemoUser() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user WHERE id = 1", Integer.class);
        if (count != null && count > 0) {
            log.info("Demo-użytkownik już istnieje");
            return;
        }

        jdbcTemplate.update(
                "INSERT INTO app_user (id, first_name, last_name, email, password_hash, pesel, role, created_at) " +
                "VALUES (1, 'Jan', 'Demo', ?, ?, ?, 'PATIENT', NOW())",
                DEMO_EMAIL,
                passwordEncoder.encode(DEMO_PASSWORD),
                DEMO_PESEL
        );
        // Synchronizuj sekwencję żeby kolejni użytkownicy dostali id >= 2
        jdbcTemplate.execute(
                "SELECT setval(pg_get_serial_sequence('app_user', 'id'), " +
                "GREATEST((SELECT MAX(id) FROM app_user), 1))");
        log.info("Demo-użytkownik utworzony: {} (pesel: {})", DEMO_EMAIL, DEMO_PESEL);
    }

    private void runSeed(String path) {
        try {
            Resource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                log.warn("Seed {} nie znaleziony na classpath", path);
                return;
            }
            ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
            populator.setSeparator(";");
            populator.setSqlScriptEncoding("UTF-8");
            populator.execute(dataSource);
            log.info("Seed {} — wykonany", path);
        } catch (Exception e) {
            log.warn("Seed {} nie powiódł się: {}", path, e.getMessage());
        }
    }
}
