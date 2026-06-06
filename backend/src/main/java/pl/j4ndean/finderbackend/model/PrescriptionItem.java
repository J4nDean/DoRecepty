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

    @Column(name = "realization_date_from")
    private LocalDate realizationDateFrom;

    @Column(name = "refund_level", length = 20)
    private String refundLevel;

    @Column(length = 20)
    private String status;
}
