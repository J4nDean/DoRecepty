package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.service.FavoritePharmacyService;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/favorites")
@RequiredArgsConstructor
public class FavoritePharmacyController {

    private final FavoritePharmacyService favoritePharmacyService;

    @GetMapping
    public List<Long> getFavorites(@PathVariable Long userId) {
        return favoritePharmacyService.getFavoritePharmacyIds(userId);
    }

    @PostMapping("/{pharmacyId}")
    public ResponseEntity<Void> addFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        favoritePharmacyService.addFavorite(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{pharmacyId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        favoritePharmacyService.removeFavorite(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }
}
