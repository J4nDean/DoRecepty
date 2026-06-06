package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;
import pl.j4ndean.finderbackend.model.PrescriptionStatus;

import java.time.LocalDate;
import java.util.List;

public record PrescriptionDto(
    Long id, String accessCode, LocalDate issueDate, LocalDate expirationDate,
    String doctorNpwz, String clinicRegon, String status, PatientDto patient, List<ItemDto> items
) {
    public record PatientDto(Long id, String pesel) {}
    public record ItemDto(Long id, String prescriptionOid, Integer positionInPackage, MedicationDto medication, Integer quantity, String dosageInstructions, LocalDate realizationDateFrom, String refundLevel, String status) {}
    public record MedicationDto(Long id, String name, String commonName, String strength, String pharmaceuticalForm, String packageSize) {}

    public static PrescriptionDto from(Prescription p, List<PrescriptionItem> items) {
        var patient = p.getPatient() != null ? new PatientDto(p.getPatient().getId(), p.getPatient().getPesel()) : null;
        var itemDtos = items.stream().map(i -> {
            var m = i.getMedication();
            return new ItemDto(i.getId(), i.getPrescriptionOid(), i.getPositionInPackage(),
                new MedicationDto(m.getId(), m.getName(), m.getCommonName(), m.getStrength(), m.getPharmaceuticalForm(), m.getPackageSize()),
                i.getQuantity(), i.getDosageInstructions(), i.getRealizationDateFrom(), i.getRefundLevel(), i.getStatus());
        }).toList();
        String effectiveStatus = PrescriptionStatus.from(p.getStatus()).effective(p.getExpirationDate()).name();
        return new PrescriptionDto(p.getId(), p.getAccessCode(), p.getIssueDate(), p.getExpirationDate(), p.getDoctorNpwz(), p.getClinicRegon(), effectiveStatus, patient, itemDtos);
    }
}
