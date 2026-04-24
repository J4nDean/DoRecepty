package pl.j4ndean.finderbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.j4ndean.finderbackend.model.Recipe;
import java.util.List;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    List<Recipe> findByPesel(String pesel);
}
