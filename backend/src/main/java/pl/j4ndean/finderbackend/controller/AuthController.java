package pl.j4ndean.finderbackend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
}
