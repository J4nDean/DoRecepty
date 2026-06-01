package pl.j4ndean.finderbackend.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.List;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_EMAIL    = "demo@dorecepty.pl";
    private static final String DEMO_PASSWORD = "Demo1234!";
    private static final String DEMO_PESEL    = "44051401458";

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

    @Override
    public void run(String... args) {
        fixPrescriptionSequence();
        truncateAll();
        ensureDemoUser();
        ensurePersonalUser();
        runSeed("db/seed/01_pharmacies.sql");
        runSeed("db/seed/02_medications.sql");
        runSeed("db/seed/03_prescriptions.sql");
        runSeed("db/seed/04_pharmacy_inventory.sql");
    }

    private void fixPrescriptionSequence() {
        try {
            jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS prescription_id_seq");
            jdbcTemplate.execute(
                    "ALTER TABLE prescription ALTER COLUMN id SET DEFAULT nextval('prescription_id_seq')");
        } catch (Exception e) {
            log.debug("Prescription sequence already configured: {}", e.getMessage());
        }
    }

    private void truncateAll() {
        try {
            jdbcTemplate.execute(
                    "TRUNCATE prescription_item, pharmacy_inventory, user_favorite_pharmacy, " +
                    "prescription, medication, pharmacy RESTART IDENTITY");
            log.info("Tabele danych wyczyszczone");
        } catch (Exception e) {
            log.error("Truncate nie powiódł się, próba fallback: {}", e.getMessage());
            for (String table : List.of("prescription_item", "pharmacy_inventory",
                    "user_favorite_pharmacy", "prescription", "medication", "pharmacy")) {
                try {
                    jdbcTemplate.execute("TRUNCATE " + table + " RESTART IDENTITY CASCADE");
                } catch (Exception ex) {
                    log.warn("Nie można wyczyścić tabeli {}: {}", table, ex.getMessage());
                }
            }
        }
    }

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
                DEMO_PESEL);
        syncUserSequence();
        log.info("Demo-użytkownik utworzony: {}", DEMO_EMAIL);
    }

    private void ensurePersonalUser() {
        if (personalEmail.isBlank() || personalPassword.isBlank() || personalPesel.isBlank()) {
            log.info("Env vars SEED_PERSONAL_* nie ustawione — konto osobiste nie zostanie utworzone");
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
                personalPesel);
        syncUserSequence();
        log.info("Konto osobiste utworzone: {}", personalEmail);
    }

    private void syncUserSequence() {
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
