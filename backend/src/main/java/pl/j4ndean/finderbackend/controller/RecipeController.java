package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.model.Prescription;
import pl.j4ndean.finderbackend.service.MockP1Service;
import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final MockP1Service mockP1Service;

    @GetMapping("/{pesel}")
    public List<Prescription> getRecipes(@PathVariable String pesel) {
        return mockP1Service.getPrescriptionsByPesel(pesel);
    }
}
