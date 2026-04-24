package pl.j4ndean.finderbackend.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pl.j4ndean.finderbackend.model.Pharmacy;
import java.util.List;

public interface PharmacyRepository extends JpaRepository<Pharmacy, Long> {
    List<Pharmacy> findByCityContainingIgnoreCase(String city, Pageable pageable);
    List<Pharmacy> findByCityContainingIgnoreCase(String city);
}
