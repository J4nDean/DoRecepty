package pl.j4ndean.finderbackend.dto;

import pl.j4ndean.finderbackend.model.User;

public record AdminUserDto(Long id, String firstName, String lastName, String email, String pesel) {
    public static AdminUserDto from(User u) {
        return new AdminUserDto(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPesel());
    }
}
