package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.model.PrescriptionItem;

import java.util.List;

public record AdminPrescriptionDto(
    Long id, String accessCode, String issueDate, String expirationDate,
    String status, String patientPesel, String patientName, Long patientId,
    List<AdminItemDto> items
) {
    public static AdminPrescriptionDto from(Prescription p, List<PrescriptionItem> items) {
        String pesel = p.getPatient() != null ? p.getPatient().getPesel() : null;
        String name = p.getPatient() != null
            ? p.getPatient().getFirstName() + " " + p.getPatient().getLastName() : null;
        Long patientId = p.getPatient() != null ? p.getPatient().getId() : null;
        var itemDtos = items.stream().map(i -> new AdminItemDto(
            i.getId(), i.getMedication().getId(), i.getMedication().getName(),
            i.getMedication().getStrength(), i.getQuantity(), i.getDosageInstructions(), i.getStatus()
        )).toList();
        return new AdminPrescriptionDto(
            p.getId(), p.getAccessCode(),
            p.getIssueDate() != null ? p.getIssueDate().toString() : null,
            p.getExpirationDate() != null ? p.getExpirationDate().toString() : null,
            p.getStatus(), pesel, name, patientId, itemDtos
        );
    }
}
