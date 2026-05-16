package pl.j4ndean.finderbackend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyImportService {

    private final PharmacyRepository pharmacyRepository;
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    private static final String SQL_FILE    = "apteki_warszawa_zabki.sql";
    private static final String COORDS_FILE = "pharmacy_coords.json";

    @PostConstruct
    public void init() {
        if (pharmacyRepository.count() > 0) {
            log.info("Pharmacy table already populated — skipping import");
            return;
        }

        ClassPathResource resource = new ClassPathResource(SQL_FILE);
        if (!resource.exists()) {
            log.warn("SQL file '{}' not found in classpath — skipping import", SQL_FILE);
            return;
        }

        log.info("Importing pharmacies from {}...", SQL_FILE);
        runSqlScript(resource);
        migrateFromApteki();
        log.info("Import complete. Total pharmacies: {}", pharmacyRepository.count());
    }

    private void runSqlScript(ClassPathResource resource) {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.addScript(resource);
        populator.setSeparator(";");
        populator.setSqlScriptEncoding("UTF-8");
        populator.setIgnoreFailedDrops(true);
        populator.execute(dataSource);
    }

    private void migrateFromApteki() {
        // Start with pre-geocoded coordinates shipped with the build (generated
        // offline by scripts/geocode-pharmacies.mjs), then layer any newer
        // coordinates already saved in the DB on top — those came from real
        // user sessions and should win.
        Map<String, double[]> savedCoords = loadPreGeocodedCoords();
        log.info("Loaded {} pre-geocoded coordinates from {}", savedCoords.size(), COORDS_FILE);
        pharmacyRepository.findAll().forEach(p -> {
            if (p.getLatitude() != null && p.getLongitude() != null) {
                savedCoords.put(p.getName() + "|" + p.getAddress(),
                        new double[]{p.getLatitude(), p.getLongitude()});
            }
        });

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT nazwa_apteki, stan_apteki, typ_ulicy, nazwa_ulicy, numer_budynku, " +
                "miejscowosc, kod_pocztowy, telefon, " +
                "godziny_otwarcia_poniedzialek, godziny_otwarcia_sobota, " +
                "godziny_otwarcia_niedziela_niehandlowa " +
                "FROM apteki WHERE stan_apteki = 'AKTYWNA' " +
                "AND rodzaj_apteki IN ('APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY')"
        );

        List<Pharmacy> pharmacies = new ArrayList<>(rows.size());
        for (Map<String, Object> row : rows) {
            String street = str(row.get("typ_ulicy")) + " " + str(row.get("nazwa_ulicy"));
            String number = str(row.get("numer_budynku"));
            String address = (street.trim() + " " + number).trim();
            String name = str(row.get("nazwa_apteki"));

            Pharmacy.PharmacyBuilder builder = Pharmacy.builder()
                    .name(name)
                    .address(address)
                    .city(str(row.get("miejscowosc")))
                    .postalCode(str(row.get("kod_pocztowy")))
                    .phone(str(row.get("telefon")))
                    .status(str(row.get("stan_apteki")))
                    .openingHoursWeekdays(str(row.get("godziny_otwarcia_poniedzialek")))
                    .openingHoursSaturday(str(row.get("godziny_otwarcia_sobota")))
                    .openingHoursSunday(str(row.get("godziny_otwarcia_niedziela_niehandlowa")));

            double[] coords = savedCoords.get(name + "|" + address);
            if (coords != null) {
                builder.latitude(coords[0]).longitude(coords[1]);
            }

            pharmacies.add(builder.build());
        }

        pharmacyRepository.saveAll(pharmacies);
        log.info("Migrated {} pharmacies ({} with coords restored)", pharmacies.size(), savedCoords.size());
        jdbcTemplate.execute("DROP TABLE IF EXISTS apteki");
    }

    private static String str(Object value) {
        return value == null ? "" : value.toString().trim();
    }

    private Map<String, double[]> loadPreGeocodedCoords() {
        ClassPathResource resource = new ClassPathResource(COORDS_FILE);
        if (!resource.exists()) return new HashMap<>();
        try {
            Map<String, Map<String, Double>> raw = new ObjectMapper().readValue(
                    resource.getInputStream(),
                    new TypeReference<>() {});
            Map<String, double[]> out = new HashMap<>(raw.size());
            raw.forEach((key, value) -> {
                Double lat = value.get("lat");
                Double lng = value.get("lng");
                if (lat != null && lng != null) out.put(key, new double[]{lat, lng});
            });
            return out;
        } catch (Exception e) {
            log.warn("Failed to read {}: {}", COORDS_FILE, e.getMessage());
            return new HashMap<>();
        }
    }
}
