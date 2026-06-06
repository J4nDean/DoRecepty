package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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
            return pharmacies.findAll(PageRequest.of(0, 1000)).getContent();
        }
        return pharmacies.findByNameOrCityOrAddress(query);
    }

    public List<Pharmacy> getNearby(double lat, double lng, double radiusKm, int limit) {
        double latDelta = radiusKm / 111.0;
        double lngDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        List<Pharmacy> inBox = pharmacies.findInBoundingBox(
                lat - latDelta, lat + latDelta,
                lng - lngDelta, lng + lngDelta
        );

        return inBox.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .filter(p -> calculateDistance(lat, lng, p.getLatitude(), p.getLongitude()) <= radiusKm)
                .sorted((p1, p2) -> Double.compare(
                        calculateDistance(lat, lng, p1.getLatitude(), p1.getLongitude()),
                        calculateDistance(lat, lng, p2.getLatitude(), p2.getLongitude())
                ))
                .limit(limit)
                .toList();
    }

    public List<Pharmacy> getInBounds(double north, double south, double east, double west) {
        return pharmacies.findInBoundingBox(south, north, west, east);
    }

    public Pharmacy createPharmacy(Pharmacy pharmacy) {
        pharmacy.setId(null);
        if (pharmacy.getStatus() == null || pharmacy.getStatus().isBlank()) {
            pharmacy.setStatus("ACTIVE");
        }
        return pharmacies.save(pharmacy);
    }

    public Pharmacy updatePharmacy(Long id, Pharmacy update) {
        Pharmacy existing = pharmacies.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apteka nie istnieje"));
        existing.setName(update.getName());
        existing.setAddress(update.getAddress());
        existing.setCity(update.getCity());
        existing.setPostalCode(update.getPostalCode());
        existing.setPhone(update.getPhone());
        existing.setLatitude(update.getLatitude());
        existing.setLongitude(update.getLongitude());
        existing.setStatus(update.getStatus());
        existing.setOpeningHoursWeekdays(update.getOpeningHoursWeekdays());
        existing.setOpeningHoursSaturday(update.getOpeningHoursSaturday());
        existing.setOpeningHoursSunday(update.getOpeningHoursSunday());
        return pharmacies.save(existing);
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

    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                  * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }
}
