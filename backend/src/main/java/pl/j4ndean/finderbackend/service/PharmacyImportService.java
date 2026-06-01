package pl.j4ndean.finderbackend.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    // Demo user — stały konto testowe, zawsze id=1
    private static final String DEMO_PESEL    = "44051401458";
    private static final String DEMO_EMAIL    = "demo@dorecepty.pl";
    private static final String DEMO_PASSWORD = "Demo1234!";

    // Konto osobiste — konfigurowane przez env vars Railway:
    //   SEED_PERSONAL_EMAIL, SEED_PERSONAL_PASSWORD, SEED_PERSONAL_PESEL
    //   SEED_PERSONAL_FIRSTNAME (domyślnie: Jan), SEED_PERSONAL_LASTNAME (domyślnie: Kowalski)
    @Value("${seed.personal.email:}")
    private String personalEmail;

    @Value("${seed.personal.password:}")
    private String personalPassword;

    @Value("${seed.personal.pesel:}")
    private String personalPesel;

    @Value("${seed.personal.firstname:Jan}")
    private String personalFirstName;

    @Value("${seed.personal.lastname:Kowalski}")
    private String personalLastName;

    private final DataSource      dataSource;
    private final JdbcTemplate    jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void init() {
        truncateAll();
        ensureDemoUser();
        ensurePersonalUser();
        runSeed("db/seed/01_pharmacies.sql");
        runSeed("db/seed/02_medications.sql");
        runSeed("db/seed/03_prescriptions.sql");
        runSeed("db/seed/04_pharmacy_inventory.sql");
    }

    /**
     * Czyści wszystkie tabele danych. Nie dotyka app_user — konta przeżywają restart.
     */
    private void truncateAll() {
        jdbcTemplate.execute(
            "TRUNCATE prescription_item, pharmacy_inventory, user_favorite_pharmacy, " +
            "prescription, medication, pharmacy RESTART IDENTITY"
        );
        log.info("Tabele danych wyczyszczone");
    }

    /**
     * Tworzy demo-użytkownika z id=1, jeśli nie istnieje.
     */
    private void ensureDemoUser() {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user WHERE id = 1", Integer.class);
        if (count != null && count > 0) {
            log.info("Demo-użytkownik (id=1) już istnieje");
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO app_user (id, first_name, last_name, email, password_hash, pesel, role, created_at) " +
                "VALUES (1, 'Jan', 'Demo', ?, ?, ?, 'PATIENT', NOW())",
                DEMO_EMAIL,
                passwordEncoder.encode(DEMO_PASSWORD),
                DEMO_PESEL
        );
        syncSequence();
        log.info("Demo-użytkownik utworzony: {} (pesel: {})", DEMO_EMAIL, DEMO_PESEL);
    }

    /**
     * Tworzy konto osobiste z id=2 jeśli ustawione env vars:
     *   SEED_PERSONAL_EMAIL, SEED_PERSONAL_PASSWORD, SEED_PERSONAL_PESEL
     * Opcjonalnie: SEED_PERSONAL_FIRSTNAME, SEED_PERSONAL_LASTNAME
     */
    private void ensurePersonalUser() {
        if (personalEmail.isBlank() || personalPassword.isBlank() || personalPesel.isBlank()) {
            log.info("Env vars SEED_PERSONAL_* nie są ustawione — konto osobiste (id=2) nie zostanie utworzone");
            return;
        }
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user WHERE id = 2", Integer.class);
        if (count != null && count > 0) {
            log.info("Konto osobiste (id=2) już istnieje");
            return;
        }
        jdbcTemplate.update(
                "INSERT INTO app_user (id, first_name, last_name, email, password_hash, pesel, role, created_at) " +
                "VALUES (2, ?, ?, ?, ?, ?, 'PATIENT', NOW())",
                personalFirstName,
                personalLastName,
                personalEmail,
                passwordEncoder.encode(personalPassword),
                personalPesel
        );
        syncSequence();
        log.info("Konto osobiste utworzone: {} (pesel: {})", personalEmail, personalPesel);
    }

    private void syncSequence() {
        jdbcTemplate.execute(
                "SELECT setval(pg_get_serial_sequence('app_user', 'id'), " +
                "GREATEST((SELECT MAX(id) FROM app_user), 2))");
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
