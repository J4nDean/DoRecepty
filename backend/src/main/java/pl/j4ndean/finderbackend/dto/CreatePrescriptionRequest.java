package pl.j4ndean.finderbackend.dto;

import java.util.List;

public record CreatePrescriptionRequest(
    Long patientId, String accessCode, String issueDate, String expirationDate,
    String doctorNpwz, String clinicRegon, String status, List<CreateItemRequest> items
) {
    public record CreateItemRequest(Long medicationId, Integer quantity, String dosageInstructions) {}
}
