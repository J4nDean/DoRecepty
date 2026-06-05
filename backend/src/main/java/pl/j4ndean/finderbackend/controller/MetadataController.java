package pl.j4ndean.finderbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    public record EnumOption(String code, String label, String category) {
        public static EnumOption of(String c, String l, String cat) { return new EnumOption(c, l, cat); }
        public static EnumOption of(String c, String l) { return new EnumOption(c, l, null); }
    }

    public record AppMetadata(
        List<EnumOption> prescriptionStatuses,
        List<EnumOption> drugRealizationStatuses,
        List<EnumOption> medicationAvailabilityStatuses
    ) {}

    private static final AppMetadata METADATA = new AppMetadata(
            List.of(
                    EnumOption.of("AKTYWNA",                "Aktywna",                "ACTIVE"),
                    EnumOption.of("CZĘŚCIOWO_ZREALIZOWANA", "Częściowo zrealizowana", "ACTIVE"),
                    EnumOption.of("NIEZREALIZOWANA",        "Niezrealizowana",        "ACTIVE"),
                    EnumOption.of("ZREALIZOWANA",           "Zrealizowana",           "ARCHIVED"),
                    EnumOption.of("ARCHIWALNA",             "Archiwalna",             "ARCHIVED"),
                    EnumOption.of("ANULOWANA",              "Anulowana",              "ARCHIVED")
            ),
            List.of(
                    EnumOption.of("NIEZREALIZOWANY", "Niezrealizowany"),
                    EnumOption.of("ZREALIZOWANY",    "Zrealizowany"),
                    EnumOption.of("CZĘŚCIOWO",       "Częściowo")
            ),
            List.of(
                    EnumOption.of("DOSTĘPNY",           "✓ Dostępny"),
                    EnumOption.of("CZĘŚCIOWO_DOSTĘPNY", "~ Częściowo"),
                    EnumOption.of("NIEDOSTĘPNY",        "✕ Brak")
            )
    );

    @GetMapping
    public AppMetadata getAll() {
        return METADATA;
    }
}
