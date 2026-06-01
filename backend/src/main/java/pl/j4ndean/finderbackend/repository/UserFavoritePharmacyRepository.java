package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.j4ndean.finderbackend.model.UserFavoritePharmacy;

import java.util.List;
import java.util.Optional;

public interface UserFavoritePharmacyRepository extends JpaRepository<UserFavoritePharmacy, Long> {

    List<UserFavoritePharmacy> findByUserId(Long userId);

    Optional<UserFavoritePharmacy> findByUserIdAndPharmacyId(Long userId, Long pharmacyId);

    void deleteByUserIdAndPharmacyId(Long userId, Long pharmacyId);
}
