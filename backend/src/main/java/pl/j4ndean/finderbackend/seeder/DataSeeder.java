package pl.j4ndean.finderbackend.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Seed startowy aplikacji. Jest IDEMPOTENTNY i NIENISZCZĄCY:
 *  - dane referencyjne (apteki, leki, stany magazynowe) wgrywane są tylko gdy tabela jest pusta,
 *  - jeden użytkownik testowy tworzony jest tylko gdy jeszcze nie istnieje,
 *  - recepty demo dosiewane są tylko gdy użytkownik nie ma żadnych.
 *
 * Dzięki temu konta zakładane przez /api/auth/register oraz dane użytkowników
 * przeżywają restart i redeploy (np. na Railway) — nic nie jest kasowane.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    // Użytkownik testowy do logowania w demo.
    private static final String TEST_FIRST_NAME = "Jan";
    private static final String TEST_LAST_NAME  = "Kowalski";
    private static final String TEST_EMAIL      = "jan.kowalski@dorecepty.test";
    private static final String TEST_PASSWORD   = "TestHaslo1!";
    private static final String TEST_PESEL      = "44051401458";

    private final DataSource              dataSource;
    private final JdbcTemplate            jdbcTemplate;
    private final PasswordEncoder         passwordEncoder;
    private final PrescriptionSeedService prescriptionSeedService;

    @Override
    public void run(String... args) {
        seedIfEmpty("pharmacy",            "db/seed/01_pharmacies.sql");
        seedIfEmpty("medication",          "db/seed/02_medications.sql");
        seedIfEmpty("pharmacy_inventory",  "db/seed/04_pharmacy_inventory.sql");
        Long userId = ensureTestUser();
        prescriptionSeedService.seedForUser(userId);
    }

    /** Wgrywa skrypt SQL tylko gdy podana tabela jest pusta. */
    private void seedIfEmpty(String table, String path) {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
            if (count != null && count > 0) {
                log.info("Tabela {} ma już {} rekordów — pomijam seed {}", table, count, path);
                return;
            }
        } catch (Exception e) {
            log.warn("Nie można sprawdzić tabeli {} (zostanie zaseedowana): {}", table, e.getMessage());
        }
        runSeed(path);
    }

    /** Tworzy użytkownika testowego tylko gdy jeszcze nie istnieje. Zwraca jego id. */
    private Long ensureTestUser() {
        Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM app_user WHERE email = ?", Integer.class, TEST_EMAIL);
        if (exists == null || exists == 0) {
            jdbcTemplate.update(
                    "INSERT INTO app_user (first_name, last_name, email, password_hash, pesel, role, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, 'PATIENT', NOW())",
                    TEST_FIRST_NAME, TEST_LAST_NAME, TEST_EMAIL,
                    passwordEncoder.encode(TEST_PASSWORD), TEST_PESEL);
            log.info("Użytkownik testowy utworzony: {} (hasło: {})", TEST_EMAIL, TEST_PASSWORD);
        } else {
            log.info("Użytkownik testowy {} już istnieje — pomijam", TEST_EMAIL);
        }
        return jdbcTemplate.queryForObject(
                "SELECT id FROM app_user WHERE email = ?", Long.class, TEST_EMAIL);
    }

    private void runSeed(String path) {
        try {
            Resource resource = new ClassPathResource(path);
            if (!resource.exists()) {
                log.warn("Seed {} nie znaleziony", path);
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
