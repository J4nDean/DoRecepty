package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.Comparator;
import java.util.List;

/**
 * Wyszukiwanie aptek: po mieście, w pobliżu (po współrzędnych) i w obrębie widocznego fragmentu mapy.
 */
@RestController
@RequestMapping("/api/pharmacies")
@RequiredArgsConstructor
public class PharmacyController {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double KM_PER_DEGREE_LAT = 111.0;
    private static final int MAX_PAGE_SIZE = 100;

    private final PharmacyRepository pharmacies;

    @GetMapping("/search")
    public List<Pharmacy> search(@RequestParam String city,
                                 @RequestParam(defaultValue = "0") int page,
                                 @RequestParam(defaultValue = "50") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return pharmacies.findByCityContainingIgnoreCase(city, PageRequest.of(page, safeSize));
    }

    @GetMapping("/nearby")
    public List<Pharmacy> nearby(@RequestParam double lat,
                                 @RequestParam double lng,
                                 @RequestParam(defaultValue = "10") double radiusKm,
                                 @RequestParam(defaultValue = "20") int limit) {
        double latDelta = radiusKm / KM_PER_DEGREE_LAT;
        double lngDelta = radiusKm / (KM_PER_DEGREE_LAT * Math.cos(Math.toRadians(lat)));

        record Scored(Pharmacy pharmacy, double distanceKm) {}

        return pharmacies.findInBoundingBoxWithCityFallback(
                        lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta).stream()
                .map(p -> new Scored(p, isGeocoded(p)
                        ? haversineKm(lat, lng, p.getLatitude(), p.getLongitude())
                        : Double.MAX_VALUE))
                .filter(s -> s.distanceKm == Double.MAX_VALUE || s.distanceKm <= radiusKm)
                .sorted(Comparator.comparingDouble(Scored::distanceKm))
                .limit(limit)
                .map(Scored::pharmacy)
                .toList();
    }

    @GetMapping("/in-bounds")
    public List<Pharmacy> inBounds(@RequestParam double north,
                                   @RequestParam double south,
                                   @RequestParam double east,
                                   @RequestParam double west) {
        return pharmacies.findInBoundingBox(south, north, west, east);
    }

    @PostMapping("/update-location")
    public void updateLocation(@RequestBody Pharmacy update) {
        pharmacies.findByCityContainingIgnoreCase(update.getCity()).stream()
                .filter(p -> p.getAddress().equalsIgnoreCase(update.getAddress()))
                .findFirst()
                .ifPresent(existing -> {
                    existing.setLatitude(update.getLatitude());
                    existing.setLongitude(update.getLongitude());
                    pharmacies.save(existing);
                });
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
