package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.User;

public record AuthResponse(Long id, String firstName, String lastName, String email, String pesel, String role, String token) {
    public static AuthResponse from(User u, String token) {
        return new AuthResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPesel(),
                u.getRole() != null ? u.getRole().name() : null, token);
    }
}
