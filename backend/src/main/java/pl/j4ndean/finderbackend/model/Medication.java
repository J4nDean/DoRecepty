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

    @Column(length = 14)
    private String gtin;

    @Column(length = 255)
    private String name;

    @Column(length = 255)
    private String commonName;

    @Column(length = 100)
    private String strength;

    @Column(length = 150)
    private String pharmaceuticalForm;

    @Column(length = 100)
    private String packageSize;

    @Column(length = 10)
    private String atcCode;

    @Column(length = 10)
    private String prescriptionCategory;
}
