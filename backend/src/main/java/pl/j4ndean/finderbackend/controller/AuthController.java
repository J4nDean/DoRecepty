package pl.j4ndean.finderbackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.dto.AuthResponse;
import pl.j4ndean.finderbackend.dto.LoginRequest;
import pl.j4ndean.finderbackend.dto.RegisterRequest;
import pl.j4ndean.finderbackend.exception.ConflictException;
import pl.j4ndean.finderbackend.model.Role;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.UserRepository;
import pl.j4ndean.finderbackend.service.JwtService;

/**
 * Rejestracja i logowanie. Po sukcesie zwraca dane użytkownika + token JWT.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String INVALID_CREDENTIALS = "Nieprawidłowy email lub hasło";

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (users.existsByEmail(req.email())) {
            throw new ConflictException("email", "Konto z tym adresem email już istnieje");
        }
        if (users.existsByPesel(req.pesel())) {
            throw new ConflictException("pesel", "Konto z tym numerem PESEL już istnieje");
        }

        User saved = users.save(User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .pesel(req.pesel())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.PATIENT)
                .build());

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(saved, tokenFor(saved)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        User user = users.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }

        return ResponseEntity.ok(AuthResponse.from(user, tokenFor(user)));
    }

    private String tokenFor(User user) {
        return jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : "PATIENT");
    }
}
