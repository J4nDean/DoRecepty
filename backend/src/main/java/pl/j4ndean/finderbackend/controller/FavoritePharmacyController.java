package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.model.UserFavoritePharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserFavoritePharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.List;

/**
 * Ulubione apteki użytkownika — lista id oraz dodawanie/usuwanie.
 */
@RestController
@RequestMapping("/api/users/{userId}/favorites")
@RequiredArgsConstructor
public class FavoritePharmacyController {

    private final UserFavoritePharmacyRepository favorites;
    private final UserRepository users;
    private final PharmacyRepository pharmacies;

    @GetMapping
    public List<Long> getFavorites(@PathVariable Long userId) {
        return favorites.findByUserId(userId).stream()
                .map(f -> f.getPharmacy().getId())
                .toList();
    }

    @PostMapping("/{pharmacyId}")
    @Transactional
    public ResponseEntity<Void> addFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        if (favorites.findByUserIdAndPharmacyId(userId, pharmacyId).isEmpty()) {
            User user = users.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Użytkownik nie istnieje"));
            Pharmacy pharmacy = pharmacies.findById(pharmacyId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apteka nie istnieje"));
            favorites.save(UserFavoritePharmacy.builder().user(user).pharmacy(pharmacy).build());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{pharmacyId}")
    @Transactional
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        favorites.deleteByUserIdAndPharmacyId(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }
}
