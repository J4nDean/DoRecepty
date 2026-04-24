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
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
public class PharmacyController {

    private final PharmacyService pharmacyService;
    private final PharmacyRepository pharmacyRepository;

    @GetMapping("/search")
    public List<Pharmacy> searchPharmacies(@RequestParam String city) {
        return pharmacyService.searchByCity(city);
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
