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
    private String name;
    private String address;
    private String city;
    private String postalCode;
    private String phone;
    private String status;
    private String openingHoursWeekdays;
    private String openingHoursSaturday;
    private String openingHoursSunday;
    private Double latitude;
    private Double longitude;
}
