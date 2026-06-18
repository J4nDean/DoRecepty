package pl.j4ndean.finderbackend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.dto.AuthResponse;
import pl.j4ndean.finderbackend.dto.LoginRequest;
import pl.j4ndean.finderbackend.dto.RegisterRequest;
import pl.j4ndean.finderbackend.exception.ConflictException;
import pl.j4ndean.finderbackend.model.User;
import pl.j4ndean.finderbackend.repository.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;


@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository users;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @InjectMocks AuthService authService;

    private RegisterRequest sampleRegister() {
        return new RegisterRequest("Jan", "Kowalski", "jan@example.com", "12345678901", "haslo123");
    }



    @Test
    void register_pozytywny_tworzyKontoIZwracaToken() {
        when(users.existsByEmail("jan@example.com")).thenReturn(false);
        when(users.existsByPesel("12345678901")).thenReturn(false);
        when(passwordEncoder.encode("haslo123")).thenReturn("zahaszowane");
        when(users.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });
        when(jwtService.generateToken(1L, "jan@example.com", "PATIENT")).thenReturn("token-jwt");

        AuthResponse res = authService.register(sampleRegister());

        assertThat(res.email()).isEqualTo("jan@example.com");
        assertThat(res.role()).isEqualTo("PATIENT");
        assertThat(res.token()).isEqualTo("token-jwt");
        verify(users).save(any(User.class));
    }

    @Test
    void register_negatywny_rzucaConflictGdyEmailZajety() {
        when(users.existsByEmail("jan@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(sampleRegister()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("email");

        verify(users, never()).save(any());
    }


    @Test
    void login_pozytywny_zwracaTokenDlaPoprawnychDanych() {
        User user = User.builder().id(7L).email("jan@example.com")
                .passwordHash("hash").role(User.Role.PATIENT).build();
        when(users.findByEmail("jan@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("haslo123", "hash")).thenReturn(true);
        when(jwtService.generateToken(7L, "jan@example.com", "PATIENT")).thenReturn("token-jwt");

        AuthResponse res = authService.login(new LoginRequest("jan@example.com", "haslo123"));

        assertThat(res.token()).isEqualTo("token-jwt");
    }

    @Test
    void login_negatywny_rzuca401GdyZleHaslo() {
        User user = User.builder().id(7L).email("jan@example.com")
                .passwordHash("hash").role(User.Role.PATIENT).build();
        when(users.findByEmail("jan@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("zle", "hash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("jan@example.com", "zle")))
                .isInstanceOf(ResponseStatusException.class);
    }
}
