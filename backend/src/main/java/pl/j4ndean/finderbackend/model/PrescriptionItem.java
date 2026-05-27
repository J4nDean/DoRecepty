package pl.j4ndean.finderbackend.model;

import jakarta.persistence.*;
import lombok.*;

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

    /** Recepta, do której należy ta pozycja. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    /** Lek przepisany w tej pozycji. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false)
    private Medication medication;

    /** Liczba opakowań przepisanych przez lekarza. */
    private Integer quantity;

    /** Instrukcja dawkowania w wolnym tekście. */
    @Column(length = 500)
    private String dosageInstructions;
}
