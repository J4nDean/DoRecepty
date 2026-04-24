package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.service.PharmacyService;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacies")
@RequiredArgsConstructor
public class PharmacyController {
    private final PharmacyService pharmacyService;

    @GetMapping
    public List<Pharmacy> getAllPharmacies() {
        return pharmacyService.getAll();
    }

    @GetMapping("/search")
    public List<Pharmacy> searchPharmacies(@RequestParam String city) {
        return pharmacyService.searchByCity(city);
    }
}
