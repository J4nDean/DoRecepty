package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyService {
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final PharmacyRepository pharmacyRepository;

    public List<Pharmacy> searchByCity(String city) {
        return pharmacyRepository.findByCityContainingIgnoreCase(city, PageRequest.of(0, 50));
    }

    public List<Pharmacy> getAll() {
        return pharmacyRepository.findAll();
    }

    public List<Pharmacy> findInBounds(double minLat, double maxLat, double minLng, double maxLng) {
        // City-fallback: returns geocoded pharmacies inside the viewport PLUS ungeocoded
        // pharmacies from any city that already has at least one geocoded entry in the
        // viewport. This lets border cities (e.g. Ząbki) appear once their first pharmacy
        // is geocoded by the frontend and saved via /update-location.
        return pharmacyRepository.findInBoundingBoxWithCityFallback(minLat, maxLat, minLng, maxLng);
    }

    public List<Pharmacy> findNearby(double lat, double lng, double radiusKm, int limit) {
        double latDelta = radiusKm / 111.0;
        double lngDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(lat)));

        return pharmacyRepository.findInBoundingBoxWithCityFallback(
                        lat - latDelta, lat + latDelta,
                        lng - lngDelta, lng + lngDelta)
                .stream()
                // geocoded: filter by real haversine distance; ungeocoded: always include
                .filter(p -> p.getLatitude() == null || p.getLongitude() == null
                        || haversineKm(lat, lng, p.getLatitude(), p.getLongitude()) <= radiusKm)
                // sort geocoded first (by distance), ungeocoded at the end
                .sorted(Comparator.comparingDouble(p ->
                        p.getLatitude() == null ? Double.MAX_VALUE
                                : haversineKm(lat, lng, p.getLatitude(), p.getLongitude())))
                .limit(limit)
                .toList();
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    }
}
