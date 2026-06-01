package pl.j4ndean.finderbackend.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(

    @NotBlank(message = "Imię jest wymagane")
    @Size(max = 100, message = "Imię nie może przekraczać 100 znaków")
    String firstName,

    @NotBlank(message = "Nazwisko jest wymagane")
    @Size(max = 100, message = "Nazwisko nie może przekraczać 100 znaków")
    String lastName,

    @NotBlank(message = "Email jest wymagany")
    @Email(message = "Podaj prawidłowy adres email")
    @Size(max = 255, message = "Email nie może przekraczać 255 znaków")
    String email,

    @NotBlank(message = "PESEL jest wymagany")
    @Pattern(regexp = "\\d{11}", message = "PESEL musi zawierać dokładnie 11 cyfr")
    String pesel,

    @NotBlank(message = "Hasło jest wymagane")
    @Size(min = 8, message = "Hasło musi mieć co najmniej 8 znaków")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*\\d).+$",
        message = "Hasło musi zawierać co najmniej jedną wielką literę i jedną cyfrę"
    )
    String password
) {}
