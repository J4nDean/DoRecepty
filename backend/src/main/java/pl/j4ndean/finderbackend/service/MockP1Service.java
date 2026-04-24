package pl.j4ndean.finderbackend.service;

import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Drug;
import pl.j4ndean.finderbackend.model.Recipe;
import java.util.Arrays;
import java.util.List;

@Service
public class MockP1Service {
    public List<Recipe> getRecipesByPesel(String pesel) {
        // Mocking P1 response
        return Arrays.asList(
            Recipe.builder()
                .accessCode("1234")
                .pesel(pesel)
                .status("AKTYWNA")
                .drugs(Arrays.asList(
                    Drug.builder().name("Amotaks").quantity("1 opakowanie").build(),
                    Drug.builder().name("Paracetamol").quantity("2 opakowania").build()
                ))
                .build(),
            Recipe.builder()
                .accessCode("5678")
                .pesel(pesel)
                .status("ZREALIZOWANA")
                .drugs(Arrays.asList(
                    Drug.builder().name("Ibuprofen").quantity("1 opakowanie").build()
                ))
                .build()
        );
    }
}
