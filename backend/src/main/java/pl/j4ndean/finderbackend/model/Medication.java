package pl.j4ndean.finderbackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Globalny numer identyfikacyjny opakowania (EAN/GTIN). */
    @Column(length = 14)
    private String gtin;

    /** Nazwa handlowa leku (np. "Apap Extra"). */
    @Column(length = 255)
    private String name;

    /** Nazwa powszechnie stosowana — substancja czynna (np. "Paracetamolum"). */
    @Column(length = 255)
    private String commonName;

    /** Moc/dawka leku (np. "500 mg"). */
    @Column(length = 100)
    private String strength;

    /** Postać farmaceutyczna (tabletki, syrop, żel itp.). */
    @Column(length = 150)
    private String pharmaceuticalForm;

    /** Wielkość opakowania (np. "20 tabletek"). */
    @Column(length = 100)
    private String packageSize;

    /** Kod ATC klasyfikacji anatomiczno-terapeutyczno-chemicznej. */
    @Column(length = 10)
    private String atcCode;

    /** Kategoria dostępności: OTC, Rp, Rpw, Rpz, Lz. */
    @Column(length = 10)
    private String prescriptionCategory;
}
