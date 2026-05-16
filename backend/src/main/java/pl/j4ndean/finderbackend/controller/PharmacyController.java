package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import pl.j4ndean.finderbackend.service.PharmacyService;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacies")
@RequiredArgsConstructor
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final PharmacyRepository pharmacyRepository;

    @GetMapping("/search")
    public List<Pharmacy> searchPharmacies(@RequestParam String city) {
        return pharmacyService.searchByCity(city);
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
        pharmacyRepository.findByCityContainingIgnoreCase(pharmacy.getCity()).stream()
                .filter(p -> p.getAddress().equalsIgnoreCase(pharmacy.getAddress()))
                .findFirst()
                .ifPresent(existing -> {
                    existing.setLatitude(pharmacy.getLatitude());
                    existing.setLongitude(pharmacy.getLongitude());
                    pharmacyRepository.save(existing);
                });
    }
}
