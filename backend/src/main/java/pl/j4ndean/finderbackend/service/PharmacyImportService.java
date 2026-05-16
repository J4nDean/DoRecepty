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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PharmacyImportService {

    private static final String SQL_FILE    = "apteki_warszawa_zabki.sql";
    private static final String COORDS_FILE = "pharmacy_coords.json";

    private static final String SELECT_ACTIVE_PUBLIC = """
            SELECT nazwa_apteki, stan_apteki, typ_ulicy, nazwa_ulicy, numer_budynku,
                   miejscowosc, kod_pocztowy, telefon,
                   godziny_otwarcia_poniedzialek, godziny_otwarcia_sobota,
                   godziny_otwarcia_niedziela_niehandlowa
            FROM apteki
            WHERE stan_apteki = 'AKTYWNA'
              AND rodzaj_apteki IN ('APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY')
            """;

    private final PharmacyRepository pharmacyRepository;
    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

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
        Map<String, double[]> coords = loadPreGeocodedCoords();
        log.info("Loaded {} pre-geocoded coordinates from {}", coords.size(), COORDS_FILE);

        List<Pharmacy> pharmacies = jdbcTemplate.query(SELECT_ACTIVE_PUBLIC,
                (rs, rowNum) -> toPharmacy(rs.getString("nazwa_apteki"),
                        rs.getString("stan_apteki"),
                        rs.getString("typ_ulicy"),
                        rs.getString("nazwa_ulicy"),
                        rs.getString("numer_budynku"),
                        rs.getString("miejscowosc"),
                        rs.getString("kod_pocztowy"),
                        rs.getString("telefon"),
                        rs.getString("godziny_otwarcia_poniedzialek"),
                        rs.getString("godziny_otwarcia_sobota"),
                        rs.getString("godziny_otwarcia_niedziela_niehandlowa"),
                        coords));

        pharmacyRepository.saveAll(pharmacies);
        log.info("Migrated {} pharmacies ({} with coords restored)", pharmacies.size(), coords.size());
        jdbcTemplate.execute("DROP TABLE IF EXISTS apteki");
    }

    private static Pharmacy toPharmacy(String name, String status,
                                       String streetType, String streetName, String building,
                                       String city, String postalCode, String phone,
                                       String hoursWeekdays, String hoursSaturday, String hoursSunday,
                                       Map<String, double[]> coords) {
        String address = (trim(streetType) + " " + trim(streetName)).trim();
        if (!trim(building).isEmpty()) {
            address = (address + " " + trim(building)).trim();
        }

        Pharmacy.PharmacyBuilder builder = Pharmacy.builder()
                .name(trim(name))
                .address(address)
                .city(trim(city))
                .postalCode(trim(postalCode))
                .phone(trim(phone))
                .status(trim(status))
                .openingHoursWeekdays(trim(hoursWeekdays))
                .openingHoursSaturday(trim(hoursSaturday))
                .openingHoursSunday(trim(hoursSunday));

        double[] latLng = coords.get(trim(name) + "|" + address);
        if (latLng != null) {
            builder.latitude(latLng[0]).longitude(latLng[1]);
        }
        return builder.build();
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private Map<String, double[]> loadPreGeocodedCoords() {
        ClassPathResource resource = new ClassPathResource(COORDS_FILE);
        if (!resource.exists()) return new HashMap<>();

        try {
            Map<String, Map<String, Double>> raw = new ObjectMapper().readValue(
                    resource.getInputStream(),
                    new TypeReference<>() {});
            Map<String, double[]> result = new HashMap<>(raw.size());
            raw.forEach((key, value) -> {
                Double lat = value.get("lat");
                Double lng = value.get("lng");
                if (lat != null && lng != null) {
                    result.put(key, new double[]{lat, lng});
                }
            });
            return result;
        } catch (Exception e) {
            log.warn("Failed to read {}: {}", COORDS_FILE, e.getMessage());
            return new HashMap<>();
        }
    }
}
