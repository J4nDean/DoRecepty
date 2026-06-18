package pl.j4ndean.finderbackend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;


class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",
                "dG9wU2VjcmV0S2V5Rm9ySldUQXV0aGVudGljYXRpb24hMjAyNA==");
        ReflectionTestUtils.setField(jwtService, "expirationMs", 86_400_000L);
    }

    @Test
    void token_pozytywny_odczytujeTeSameDaneCoZapisane() {
        String token = jwtService.generateToken(42L, "jan@example.com", "PATIENT");

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo("42");
        assertThat(jwtService.extractRole(token)).isEqualTo("PATIENT");
    }

    @Test
    void token_negatywny_odrzucaUszkodzonyToken() {
        assertThat(jwtService.isValid("to.nie.jest.token")).isFalse();
    }
}
