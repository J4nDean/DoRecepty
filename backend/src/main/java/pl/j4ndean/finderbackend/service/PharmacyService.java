package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyService {

    private final PharmacyRepository pharmacies;
    private static final double EARTH_RADIUS_KM = 6371.0;

    public List<Pharmacy> getAllPharmacies() {
        return pharmacies.findAll();
    }

    public List<Pharmacy> searchPharmacies(String query) {
        if (query == null || query.isBlank()) {
            return pharmacies.findAll(PageRequest.of(0, 50)).getContent();
        }
        return pharmacies.findByNameOrCityOrAddress(query);
    }

    public void updateLocation(Pharmacy update) {
        pharmacies.findByCityContainingIgnoreCase(update.getCity()).stream()
                .filter(p -> p.getAddress().equalsIgnoreCase(update.getAddress()))
                .findFirst()
                .ifPresent(existing -> {
                    existing.setLatitude(update.getLatitude());
                    existing.setLongitude(update.getLongitude());
                    pharmacies.save(existing);
                });
    }

    // Metoda pomocnicza (Utility) mogłaby zostać w serwisie lub klasie Utils
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                  * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }
}
