package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.dto.ChangePasswordRequest;
import pl.j4ndean.finderbackend.service.AccountService;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest req) {
        accountService.changePassword(id, req);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/favorites")
    public List<Long> getFavorites(@PathVariable Long userId) {
        return accountService.getUserFavorites(userId);
    }

    @PostMapping("/{userId}/favorites/{pharmacyId}")
    public ResponseEntity<Void> addFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        accountService.addFavorite(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/favorites/{pharmacyId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId, @PathVariable Long pharmacyId) {
        accountService.removeFavorite(userId, pharmacyId);
        return ResponseEntity.noContent().build();
    }
}
