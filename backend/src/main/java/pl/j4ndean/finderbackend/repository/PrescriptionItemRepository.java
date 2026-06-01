package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.j4ndean.finderbackend.model.PrescriptionItem;

import java.util.List;

public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {
    @Query("SELECT pi FROM PrescriptionItem pi JOIN FETCH pi.medication WHERE pi.prescription.id = :prescriptionId ORDER BY pi.positionInPackage")
    List<PrescriptionItem> findByPrescriptionId(@Param("prescriptionId") Long prescriptionId);
}
