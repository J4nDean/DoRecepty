package pl.j4ndean.finderbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    /** OID nadawany przez system P1/CSIOZ, np. "PL.CSIOZ.2019.xxx". */
    @Column(name = "prescription_oid", length = 44, unique = true)
    private String prescriptionOid;

    @Column(name = "oid_prefix", length = 50)
    private String oidPrefix;

    @Column(name = "position_in_package")
    private Integer positionInPackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    private Integer quantity;

    @Column(length = 500)
    private String dosageInstructions;

    /** Najwcześniejsza data realizacji ("Data realizacji: od"). */
    @Column(name = "realization_date_from")
    private LocalDate realizationDateFrom;

    /** Poziom refundacji NFZ: bezpłatny | 30% | 50% | ryczałt | 100% | null dla pełnopłatnych. */
    @Column(name = "refund_level", length = 20)
    private String refundLevel;

    /** ACTIVE | REALIZED | EXPIRED | CANCELLED */
    @Column(length = 20)
    private String status;
}
