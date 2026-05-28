package pl.j4ndean.finderbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Usuwa tabele pozostałe po starych encjach.
 * Zostają wyłącznie: app_user, prescription, medication, pharmacy,
 * prescription_item, pharmacy_inventory.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LegacyTableCleanup {

    private static final List<String> LEGACY_TABLES = List.of(
            "drug", "recipe", "apteki"
    );

    private final JdbcTemplate jdbc;

    @EventListener(ApplicationReadyEvent.class)
    public void dropLegacyTables() {
        LEGACY_TABLES.forEach(this::drop);
    }

    private void drop(String table) {
        try {
            jdbc.execute("DROP TABLE IF EXISTS " + table + " CASCADE");
            log.info("Dropped legacy table '{}' (if existed)", table);
        } catch (Exception e) {
            log.warn("Could not drop legacy table '{}': {}", table, e.getMessage());
        }
    }
}
