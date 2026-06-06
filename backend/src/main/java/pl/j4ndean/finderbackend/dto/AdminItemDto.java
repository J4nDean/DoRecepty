package pl.j4ndean.finderbackend.dto;

public record AdminItemDto(
    Long id, Long medicationId, String medicationName, String strength,
    Integer quantity, String dosageInstructions, String status
) {}
