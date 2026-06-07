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
    public List<Pharmacy> getAll() {
        return pharmacyService.getAllPharmacies();
    }

    @GetMapping("/search")
    public List<Pharmacy> search(@RequestParam(required = false) String query) {
        return pharmacyService.searchPharmacies(query);
    }

    @GetMapping("/in-bounds")
    public List<Pharmacy> getInBounds(
            @RequestParam double north,
            @RequestParam double south,
            @RequestParam double east,
            @RequestParam double west) {
        return pharmacyService.getInBounds(north, south, east, west);
    }

    @PostMapping("/update-location")
    public void updateLocation(@RequestBody Pharmacy update) {
        pharmacyService.updateLocation(update);
    }
}
