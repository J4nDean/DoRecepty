package pl.j4ndean.finderbackend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.j4ndean.finderbackend.dto.AppMetadata;
import pl.j4ndean.finderbackend.dto.EnumOption;

import java.util.List;

/**
 * Pojedyncze źródło prawdy dla list rozwijanych i kategorii enumów używanych w UI.
 * Frontend pobiera te dane raz i wykorzystuje do filtrowania, sortowania i etykiet.
 */
@RestController
@RequestMapping("/api/metadata")
public class MetadataController {

    private static final AppMetadata METADATA = new AppMetadata(
            List.of(
                    EnumOption.of("AKTYWNA",                "Aktywna",                "ACTIVE"),
                    EnumOption.of("CZĘŚCIOWO_ZREALIZOWANA", "Częściowo zrealizowana", "ACTIVE"),
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
