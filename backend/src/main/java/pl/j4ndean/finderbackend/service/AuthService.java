package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.dto.AuthResponse;
import pl.j4ndean.finderbackend.dto.LoginRequest;
import pl.j4ndean.finderbackend.dto.RegisterRequest;
import pl.j4ndean.finderbackend.exception.ConflictException;
import pl.j4ndean.finderbackend.model.Role;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.UserRepository;
import pl.j4ndean.finderbackend.seeder.PrescriptionSeedService;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Nieprawidłowy email lub hasło";

    private final UserRepository           userRepository;
    private final PasswordEncoder          passwordEncoder;
    private final JwtService               jwtService;
    private final PrescriptionSeedService  prescriptionSeedService;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ConflictException("email", "Konto z tym adresem email już istnieje");
        }
        if (userRepository.existsByPesel(req.pesel())) {
            throw new ConflictException("pesel", "Konto z tym numerem PESEL już istnieje");
        }

        User saved = userRepository.save(User.builder()
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .pesel(req.pesel())
                .passwordHash(passwordEncoder.encode(req.password()))
                .role(Role.PATIENT)
                .build());

        prescriptionSeedService.seedForUser(saved.getId());

        return AuthResponse.from(saved, generateToken(saved));
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
        }

        return AuthResponse.from(user, generateToken(user));
    }

    private String generateToken(User user) {
        return jwtService.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : "PATIENT");
    }
}
