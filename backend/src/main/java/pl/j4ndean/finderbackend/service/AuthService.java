package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.controller.AuthController.AuthResponse;
import pl.j4ndean.finderbackend.controller.AuthController.LoginRequest;
import pl.j4ndean.finderbackend.controller.AuthController.RegisterRequest;
import pl.j4ndean.finderbackend.exception.ConflictException;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email())) throw new ConflictException("email", "Konto z tym adresem email już istnieje");
        if (users.existsByPesel(req.pesel())) throw new ConflictException("pesel", "Konto z tym numerem PESEL już istnieje");

        User saved = users.save(User.builder()
                .firstName(req.firstName()).lastName(req.lastName()).email(req.email()).pesel(req.pesel())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(User.Role.PATIENT).build());

        return AuthResponse.from(saved, tokenFor(saved));
    }

    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email())
                .filter(u -> passwordEncoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Nieprawidłowy email lub hasło"));

        return AuthResponse.from(user, tokenFor(user));
    }

    private String tokenFor(User user) {
        return jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
    }
}
