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

    /**
     * Identyfikator e-recepty z zewnętrznego systemu P1/CSIOZ.
     * VARCHAR(44) — nie jest generowany przez bazę, ustawiany przez aplikację.
     */
    @Id
    @Column(length = 44)
    private String id;

    /** Czterocyfrowy kod dostępu podawany wraz z PESEL w aptece. */
    @Column(columnDefinition = "CHAR(4)")
    private String accessCode;

    /** Data wystawienia recepty. */
    private LocalDate issueDate;

    /** Data ważności recepty. */
    private LocalDate expirationDate;

    /** Pacjent, dla którego wystawiono receptę. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private User patient;

    /** Numer Prawa Wykonywania Zawodu lekarza wystawiającego (7 cyfr). */
    @Column(columnDefinition = "CHAR(7)")
    private String doctorNpwz;

    /** REGON podmiotu leczniczego (placówki), 9 lub 14 znaków. */
    @Column(length = 14)
    private String clinicRegon;

    /** Stan recepty: ACTIVE, REALIZED, EXPIRED, CANCELLED. */
    @Column(length = 20)
    private String status;
}
