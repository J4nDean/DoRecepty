package pl.j4ndean.finderbackend.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.j4ndean.finderbackend.model.Pharmacy;
import java.util.List;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    List<Pharmacy> findByCityContainingIgnoreCase(String city, Pageable pageable);
    List<Pharmacy> findByCityContainingIgnoreCase(String city);

    @Query("SELECT p FROM Pharmacy p WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL " +
            "AND p.latitude BETWEEN :minLat AND :maxLat " +
            "AND p.longitude BETWEEN :minLng AND :maxLng")
    List<Pharmacy> findInBoundingBox(@Param("minLat") double minLat,
                                     @Param("maxLat") double maxLat,
                                     @Param("minLng") double minLng,
                                     @Param("maxLng") double maxLng);
}
