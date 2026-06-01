package pl.j4ndean.finderbackend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.exception.ConflictException;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.UserRepository;
import pl.j4ndean.finderbackend.service.JwtService;

/**
 * Obsługa autoryzacji. DTO zdefiniowane lokalnie jako rekordy dla uproszczenia struktury.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    
    public record RegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 11, max = 11) String pesel,
        @NotBlank @Size(min = 6) String password
    ) {}

    public record AuthResponse(Long id, String firstName, String lastName, String email, String pesel, String token) {
        public static AuthResponse from(User u, String token) {
            return new AuthResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.getPesel(), token);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        if (users.existsByEmail(req.email())) throw new ConflictException("email", "Konto z tym adresem email już istnieje");
        if (users.existsByPesel(req.pesel())) throw new ConflictException("pesel", "Konto z tym numerem PESEL już istnieje");

        User saved = users.save(User.builder()
                .firstName(req.firstName()).lastName(req.lastName()).email(req.email()).pesel(req.pesel())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(User.Role.PATIENT).build());

        return ResponseEntity.status(HttpStatus.CREATED).body(AuthResponse.from(saved, tokenFor(saved)));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        User user = users.findByEmail(req.email())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy email lub hasło"));

        return ResponseEntity.ok(AuthResponse.from(user, tokenFor(user)));
    }

    private String tokenFor(User user) {
        return jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
    }
}
