package pl.j4ndean.finderbackend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(indexes = @Index(columnList = "city"))
public class Pharmacy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 10)
    private String postalCode;

    @Column(length = 255)
    private String phone;

    private Double latitude;
    private Double longitude;

    private String status;

    @Column(length = 512)
    private String openingHoursWeekdays;

    @Column(length = 512)
    private String openingHoursSaturday;

    @Column(length = 512)
    private String openingHoursSunday;
}
