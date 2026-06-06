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

    @Column(columnDefinition = "CHAR(7)")
    private String doctorNpwz;

    @Column(length = 14)
    private String clinicRegon;

    @Column(length = 20)
    private String status;
}
