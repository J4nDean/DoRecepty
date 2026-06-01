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
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_key", length = 44, unique = true)
    private String packageKey;

    @Column(columnDefinition = "CHAR(4)")
    private String accessCode;

    private LocalDate issueDate;

    private LocalDate expirationDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    /** NPwZ lekarza wystawiającego (7 cyfr). */
    @Column(columnDefinition = "CHAR(7)")
    private String doctorNpwz;

    /** REGON podmiotu leczniczego (9 lub 14 znaków). */
    @Column(length = 14)
    private String clinicRegon;

    /** ACTIVE | PARTIALLY_REALIZED | REALIZED | EXPIRED | CANCELLED */
    @Column(length = 20)
    private String status;
}
