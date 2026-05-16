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
    private static final double KM_PER_DEGREE_LAT = 111.0;
    private static final int CITY_SEARCH_LIMIT = 50;

    private final PharmacyRepository pharmacyRepository;

    public List<Pharmacy> searchByCity(String city) {
        return pharmacyRepository.findByCityContainingIgnoreCase(city, PageRequest.of(0, CITY_SEARCH_LIMIT));
    }

    public List<Pharmacy> findInBounds(double minLat, double maxLat, double minLng, double maxLng) {
        return pharmacyRepository.findInBoundingBox(minLat, maxLat, minLng, maxLng);
    }

    public List<Pharmacy> findNearby(double lat, double lng, double radiusKm, int limit) {
        double latDelta = radiusKm / KM_PER_DEGREE_LAT;
        double lngDelta = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(Math.toRadians(lat)));

        return pharmacyRepository.findInBoundingBoxWithCityFallback(
                        lat - latDelta, lat + latDelta,
                        lng - lngDelta, lng + lngDelta)
                .stream()
                .filter(p -> !isGeocoded(p) || haversineKm(lat, lng, p.getLatitude(), p.getLongitude()) <= radiusKm)
                .sorted(Comparator.comparingDouble(p -> isGeocoded(p)
                        ? haversineKm(lat, lng, p.getLatitude(), p.getLongitude())
                        : Double.MAX_VALUE))
                .limit(limit)
                .toList();
    }

    private static boolean isGeocoded(Pharmacy p) {
        return p.getLatitude() != null && p.getLongitude() != null;
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
