package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.service.PharmacyService;

import java.util.List;

/**
 * Panel administracyjny — zarządzanie rejestrem aptek.
 * Realizuje wymagania WF-11 (aktualizacja danych aptek) oraz WF-12 (dodawanie nowej apteki).
 * Dostęp wyłącznie dla użytkowników z rolą ADMIN (patrz SecurityConfig).
 */
@RestController
@RequestMapping("/api/admin/pharmacies")
@RequiredArgsConstructor
public class AdminController {

    private final PharmacyService pharmacyService;

    @GetMapping
    public List<Pharmacy> getAll() {
        return pharmacyService.getAllPharmacies();
    }

    @PostMapping
    public ResponseEntity<Pharmacy> create(@RequestBody Pharmacy pharmacy) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pharmacyService.createPharmacy(pharmacy));
    }

    @PutMapping("/{id}")
    public Pharmacy update(@PathVariable Long id, @RequestBody Pharmacy pharmacy) {
        return pharmacyService.updatePharmacy(id, pharmacy);
    }
}
