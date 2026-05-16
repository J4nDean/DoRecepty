package pl.j4ndean.finderbackend.service;

import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Drug;
import pl.j4ndean.finderbackend.model.Recipe;

import java.util.List;

@Service
public class MockP1Service {

    public List<Recipe> getRecipesByPesel(String pesel) {
        return List.of(
                Recipe.builder()
                        .accessCode("1234")
                        .pesel(pesel)
                        .status("AKTYWNA")
                        .drugs(List.of(
                                Drug.builder().name("Amotaks").quantity("1 opakowanie").build(),
                                Drug.builder().name("Paracetamol").quantity("2 opakowania").build()
                        ))
                        .build(),
                Recipe.builder()
                        .accessCode("5678")
                        .pesel(pesel)
                        .status("ZREALIZOWANA")
                        .drugs(List.of(
                                Drug.builder().name("Ibuprofen").quantity("1 opakowanie").build()
                        ))
                        .build()
        );
    }
}
