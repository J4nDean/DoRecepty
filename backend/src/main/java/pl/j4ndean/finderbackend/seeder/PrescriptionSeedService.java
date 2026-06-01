package pl.j4ndean.finderbackend.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PrescriptionSeedService {

    private final JdbcTemplate jdbcTemplate;

    private record ItemTemplate(String medicationName, int quantity, String dosage, String status) {}

    private record RecipeTemplate(
            String accessCode,
            int issueOffsetDays,
            int expirationOffsetDays,
            String doctorNpwz,
            String clinicRegon,
            String status,
            List<ItemTemplate> items) {}

    private static final List<RecipeTemplate> TEMPLATES = List.of(
            new RecipeTemplate("2341", -5, 25, "1234567", "123456789", "ACTIVE", List.of(
                    new ItemTemplate("Concor 10", 1, "1 x 1 tabl. rano", "ACTIVE"),
                    new ItemTemplate("Lisinopril Aurovitas", 1, "1 x 1 tabl. rano", "ACTIVE"),
                    new ItemTemplate("Tritace 2,5", 1, "1 x 1 tabl. rano", "ACTIVE"))),
            new RecipeTemplate("3456", -2, 28, "7654321", "987654321", "ACTIVE", List.of(
                    new ItemTemplate("Allertec", 1, "1 x 1 tabl. wieczorem", "ACTIVE"),
                    new ItemTemplate("Ventolin", 1, "W razie napadu duszności: 1-2 dawki wziewne", "ACTIVE"),
                    new ItemTemplate("Bezolen", 1, "1 x 1 tabl. wieczorem", "ACTIVE"))),
            new RecipeTemplate("8810", -120, -90, "1234567", "123456789", "REALIZED", List.of(
                    new ItemTemplate("Apap", 1, "1 tabl. w razie bólu", "REALIZED"),
                    new ItemTemplate("Ibuprom RR MAX", 1, "1 x 1 tabl. po posiłku", "REALIZED"))),
            new RecipeTemplate("8821", -95, -65, "7654321", "987654321", "REALIZED", List.of(
                    new ItemTemplate("Polprazol", 2, "1 x 1 kaps. rano przed śniadaniem", "REALIZED"))),
            new RecipeTemplate("8832", -180, -150, "1234567", "123456789", "ARCHIVED", List.of(
                    new ItemTemplate("Sortis 20", 1, "1 x 1 tabl. wieczorem", "REALIZED"))),
            new RecipeTemplate("8843", -60, -30, "7654321", "987654321", "CANCELLED", List.of(
                    new ItemTemplate("Norvasc", 1, "1 x 1 tabl. wieczorem", "CANCELLED"))),
            new RecipeTemplate("9977", -23, 7, "1234567", "123456789", "ACTIVE", List.of(
                    new ItemTemplate("Metformina Aurovitas", 1, "1 x 1 tabl. rano", "ACTIVE"),
                    new ItemTemplate("Sortis 20", 1, "1 x 1 tabl. wieczorem", "ACTIVE"))));

    @Transactional
    public void seedForUser(long userId) {
        Integer existing = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM prescription WHERE patient_id = ?", Integer.class, userId);
        if (existing != null && existing > 0) {
            log.info("Recepty dla user_id={} już istnieją — pomijam seed", userId);
            return;
        }

        int recipeNum = 0;
        for (RecipeTemplate r : TEMPLATES) {
            recipeNum++;
            String packageKey = buildPackageKey(userId, recipeNum);

            Long prescriptionId = jdbcTemplate.queryForObject(
                    "INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, " +
                            "patient_id, doctor_npwz, clinic_regon, status) " +
                            "VALUES (?, ?, CURRENT_DATE + ?, CURRENT_DATE + ?, ?, ?, ?, ?) RETURNING id",
                    Long.class,
                    packageKey, r.accessCode(), r.issueOffsetDays(), r.expirationOffsetDays(),
                    userId, r.doctorNpwz(), r.clinicRegon(), r.status());

            int position = 0;
            for (ItemTemplate it : r.items()) {
                position++;
                String oid = buildPrescriptionOid(userId, recipeNum, position);
                int inserted = jdbcTemplate.update(
                        "INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, " +
                                "position_in_package, medication_id, quantity, dosage_instructions, status) " +
                                "SELECT ?, ?, 'PL.CSIOZ.2024', ?, m.id, ?, ?, ? " +
                                "FROM medication m WHERE m.name = ?",
                        prescriptionId, oid, position, it.quantity(), it.dosage(), it.status(), it.medicationName());
                if (inserted == 0) {
                    log.warn("Lek '{}' nie znaleziony — pominięto pozycję dla recepty {}", it.medicationName(), r.accessCode());
                }
            }
        }
        log.info("Zaseedowano {} recept dla user_id={}", TEMPLATES.size(), userId);
    }

    private static String buildPackageKey(long userId, int recipeNum) {
        return String.format("PKG%013d%024d%04d", userId, 0L, recipeNum);
    }

    private static String buildPrescriptionOid(long userId, int recipeNum, int position) {
        return String.format("PL.CSIOZ.U%010d.R%04d.I%02d", userId, recipeNum, position);
    }
}
