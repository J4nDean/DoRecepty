package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.controller.AccountController.ChangePasswordRequest;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.model.UserFavoritePharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserFavoritePharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository users;
    private final PharmacyRepository pharmacies;
    private final UserFavoritePharmacyRepository favorites;
    private final PasswordEncoder passwordEncoder;

    public void changePassword(Long id, ChangePasswordRequest req) {
        User user = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Nieprawidłowe obecne hasło");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        users.save(user);
    }

    public List<Long> getUserFavorites(Long userId) {
        return favorites.findByUserId(userId).stream().map(f -> f.getPharmacy().getId()).toList();
    }

    @Transactional
    public void addFavorite(Long userId, Long pharmacyId) {
        if (favorites.findByUserIdAndPharmacyId(userId, pharmacyId).isEmpty()) {
            User user = users.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            Pharmacy pharmacy = pharmacies.findById(pharmacyId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            favorites.save(UserFavoritePharmacy.builder().user(user).pharmacy(pharmacy).build());
        }
    }

    @Transactional
    public void removeFavorite(Long userId, Long pharmacyId) {
        favorites.deleteByUserIdAndPharmacyId(userId, pharmacyId);
    }
}
