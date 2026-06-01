package pl.j4ndean.finderbackend.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.List;

/**
 * Seed startowy aplikacji (clean slate): przy każdym starcie
 *  1. czyści WSZYSTKIE tabele danych,
 *  2. wgrywa wszystkie seedy SQL z resources/db/seed (apteki, leki, stany magazynowe,
 *     użytkownicy testowi + komplet recept demo).
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    // Wszystkie seedy SQL z katalogu resources/db/seed (kolejność ma znaczenie — FK).
    private static final List<String> SEED_SCRIPTS = List.of(
            "db/seed/01_pharmacies.sql",
            "db/seed/02_medications.sql",
            "db/seed/04_pharmacy_inventory.sql",
            "db/seed/05_prescriptions.sql"
    );

    // Tabele do wyczyszczenia — kolejność bez znaczenia dzięki CASCADE.
    private static final List<String> TABLES = List.of(
            "prescription_item", "pharmacy_inventory", "user_favorite_pharmacy",
            "prescription", "medication", "pharmacy", "app_user"
    );

    private final DataSource   dataSource;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        truncateAll();
        SEED_SCRIPTS.forEach(this::runSeed);
        log.info("Seed zakończony: {} skryptów SQL", SEED_SCRIPTS.size());
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
