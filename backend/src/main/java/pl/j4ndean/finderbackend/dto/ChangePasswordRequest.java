package pl.j4ndean.finderbackend.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {}
