package pl.j4ndean.finderbackend.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.model.UserFavoritePharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserFavoritePharmacyRepository;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoritePharmacyService {

    private final UserFavoritePharmacyRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PharmacyRepository pharmacyRepository;

    public List<Long> getFavoritePharmacyIds(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(f -> f.getPharmacy().getId())
                .toList();
    }

    @Transactional
    public void addFavorite(Long userId, Long pharmacyId) {
        if (favoriteRepository.findByUserIdAndPharmacyId(userId, pharmacyId).isPresent()) {
            return;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Użytkownik nie istnieje"));
        Pharmacy pharmacy = pharmacyRepository.findById(pharmacyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apteka nie istnieje"));

        favoriteRepository.save(UserFavoritePharmacy.builder()
                .user(user)
                .pharmacy(pharmacy)
                .build());
    }

    @Transactional
    public void removeFavorite(Long userId, Long pharmacyId) {
        favoriteRepository.deleteByUserIdAndPharmacyId(userId, pharmacyId);
    }
}
