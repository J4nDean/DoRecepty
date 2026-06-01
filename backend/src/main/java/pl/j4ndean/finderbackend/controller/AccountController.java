package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
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
 * Konsolidacja operacji użytkownika: dane konta i ulubione apteki.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AccountController {

    private final UserRepository users;
    private final PharmacyRepository pharmacies;
    private final UserFavoritePharmacyRepository favorites;
    private final PasswordEncoder passwordEncoder;

    public record ChangePasswordRequest(String currentPassword, String newPassword) {}

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest req) {
        User user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nieprawidłowe obecne hasło");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/favorites")
    public List<Long> getFavorites(@PathVariable Long userId) {
        return favorites.findByUserId(userId).stream().map(f -> f.getPharmacy().getId()).toList();
    }

    @PostMapping("/{userId}/favorites/{pharmacyId}")
    @Transactional
    public ResponseEntity<Void> addFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        if (favorites.findByUserIdAndPharmacyId(userId, pharmacyId).isEmpty()) {
            User user = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            Pharmacy pharmacy = pharmacies.findById(pharmacyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            favorites.save(UserFavoritePharmacy.builder().user(user).pharmacy(pharmacy).build());
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/favorites/{pharmacyId}")
    @Transactional
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        favorites.deleteByUserIdAndPharmacyId(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }
}
