package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pl.j4ndean.finderbackend.model.PharmacyInventory;

import java.util.List;

public interface PharmacyInventoryRepository extends JpaRepository<PharmacyInventory, Long> {

    @Query("""
        SELECT inv FROM PharmacyInventory inv
        JOIN FETCH inv.pharmacy ph
        JOIN FETCH inv.medication m
        WHERE inv.medication.id IN :medicationIds
          AND inv.stockQuantity > 0
        """)
    List<PharmacyInventory> findByMedicationIds(@Param("medicationIds") List<Long> medicationIds);
}
