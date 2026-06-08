package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.j4ndean.finderbackend.model.Prescription;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {

    @Query("SELECT p FROM Prescription p JOIN FETCH p.patient WHERE p.patient.pesel = :pesel ORDER BY p.issueDate DESC")
    List<Prescription> findByPatientPesel(@Param("pesel") String pesel);

    @Query("SELECT p FROM Prescription p LEFT JOIN FETCH p.patient WHERE p.id = :id")
    Optional<Prescription> findByIdWithPatient(@Param("id") Long id);

    @Query("SELECT p FROM Prescription p LEFT JOIN FETCH p.patient ORDER BY p.issueDate DESC NULLS LAST")
    List<Prescription> findAllWithPatient();
}
