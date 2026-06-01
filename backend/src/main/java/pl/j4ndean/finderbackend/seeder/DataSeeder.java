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
import java.util.List;

/**
 * Seed startowy aplikacji (clean slate): przy każdym starcie
 *  1. czyści WSZYSTKIE tabele danych,
 *  2. wgrywa wszystkie seedy SQL (apteki, leki, stany magazynowe),
 *  3. tworzy dwóch użytkowników testowych,
 *  4. dosiewa recepty demo dla obu.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    /** Użytkownik testowy: imię, nazwisko, email, hasło, PESEL. */
    private record TestUser(String firstName, String lastName, String email, String password, String pesel) {}

    private static final List<TestUser> TEST_USERS = List.of(
            new TestUser("Jan",  "Kowalski", "jan.kowalski@dorecepty.test", "TestHaslo1!", "44051401458"),
            new TestUser("Anna", "Nowak",    "anna.nowak@dorecepty.test",   "TestHaslo1!", "85010112345")
    );

    // Wszystkie seedy SQL z katalogu resources/db/seed (kolejność ma znaczenie — FK).
    private static final List<String> SEED_SCRIPTS = List.of(
            "db/seed/01_pharmacies.sql",
            "db/seed/02_medications.sql",
            "db/seed/04_pharmacy_inventory.sql"
    );

    // Tabele do wyczyszczenia — kolejność bez znaczenia dzięki CASCADE.
    private static final List<String> TABLES = List.of(
            "prescription_item", "pharmacy_inventory", "user_favorite_pharmacy",
            "prescription", "medication", "pharmacy", "app_user"
    );

    private final DataSource              dataSource;
    private final JdbcTemplate            jdbcTemplate;
    private final PasswordEncoder         passwordEncoder;
    private final PrescriptionSeedService prescriptionSeedService;

    @Override
    public void run(String... args) {
        truncateAll();
        SEED_SCRIPTS.forEach(this::runSeed);
        for (TestUser u : TEST_USERS) {
            Long userId = createUser(u);
            prescriptionSeedService.seedForUser(userId);
        }
        log.info("Seed zakończony: {} użytkowników, {} skryptów SQL", TEST_USERS.size(), SEED_SCRIPTS.size());
    }

    private void truncateAll() {
        for (String table : TABLES) {
            try {
                jdbcTemplate.execute("TRUNCATE " + table + " RESTART IDENTITY CASCADE");
            } catch (Exception e) {
                log.warn("Nie można wyczyścić tabeli {}: {}", table, e.getMessage());
            }
        }
        log.info("Tabele danych wyczyszczone");
    }

    /** Tworzy użytkownika i zwraca jego id. */
    private Long createUser(TestUser u) {
        jdbcTemplate.update(
                "INSERT INTO app_user (first_name, last_name, email, password_hash, pesel, role, created_at) " +
                "VALUES (?, ?, ?, ?, ?, 'PATIENT', NOW())",
                u.firstName(), u.lastName(), u.email(),
                passwordEncoder.encode(u.password()), u.pesel());
        Long id = jdbcTemplate.queryForObject(
                "SELECT id FROM app_user WHERE email = ?", Long.class, u.email());
        log.info("Użytkownik utworzony: {} (PESEL {}, hasło {})", u.email(), u.pesel(), u.password());
        return id;
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
