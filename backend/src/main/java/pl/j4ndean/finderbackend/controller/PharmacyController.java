package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import pl.j4ndean.finderbackend.service.PharmacyService;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacies")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "https://*.vercel.app"})
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final PharmacyRepository pharmacyRepository;

    @GetMapping("/search")
    public List<Pharmacy> searchPharmacies(@RequestParam String city) {
        return pharmacyService.searchByCity(city);
    }

    @GetMapping("/nearby")
    public List<Pharmacy> nearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm,
            @RequestParam(defaultValue = "20") int limit) {
        return pharmacyService.findNearby(lat, lng, radiusKm, limit);
    }

    @PostMapping("/update-location")
    public void updateLocation(@RequestBody Pharmacy pharmacy) {
        pharmacyRepository.findByCityContainingIgnoreCase(pharmacy.getCity()).stream()
                .filter(p -> p.getAddress().equalsIgnoreCase(pharmacy.getAddress()))
                .findFirst()
                .ifPresent(p -> {
                    p.setLatitude(pharmacy.getLatitude());
                    p.setLongitude(pharmacy.getLongitude());
                    pharmacyRepository.save(p);
                });
    }
}
