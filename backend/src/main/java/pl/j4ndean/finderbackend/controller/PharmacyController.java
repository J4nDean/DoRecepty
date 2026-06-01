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

    @GetMapping("/search")
    public List<Pharmacy> searchPharmacies(
            @RequestParam String city,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return pharmacyService.searchByCity(city, page, size);
    }

    @GetMapping("/nearby")
    public List<Pharmacy> nearby(@RequestParam double lat,
                                 @RequestParam double lng,
                                 @RequestParam(defaultValue = "10") double radiusKm,
                                 @RequestParam(defaultValue = "20") int limit) {
        return pharmacyService.findNearby(lat, lng, radiusKm, limit);
    }

    @GetMapping("/in-bounds")
    public List<Pharmacy> inBounds(@RequestParam double north,
                                   @RequestParam double south,
                                   @RequestParam double east,
                                   @RequestParam double west) {
        return pharmacyService.findInBounds(south, north, west, east);
    }

    @PostMapping("/update-location")
    public void updateLocation(@RequestBody Pharmacy pharmacy) {
        pharmacyService.updateLocation(pharmacy);
    }
}
