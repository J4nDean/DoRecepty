package pl.j4ndean.finderbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Usuwa tabele pozostałe po starych encjach (Drug, Recipe).
 * Uruchamia się po pełnym starcie aplikacji — bezpieczne przy każdym restarcie (IF EXISTS).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LegacyTableCleanup {

    private final JdbcTemplate jdbc;

    @EventListener(ApplicationReadyEvent.class)
    public void dropLegacyTables() {
        drop("drug");
        drop("recipe");
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
