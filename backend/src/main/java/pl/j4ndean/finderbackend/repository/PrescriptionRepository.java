package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.j4ndean.finderbackend.model.Prescription;
import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, String> {
    List<Prescription> findByPatientPesel(String pesel);
}
