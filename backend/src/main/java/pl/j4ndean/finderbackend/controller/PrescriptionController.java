package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.service.P1PrescriptionService;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final P1PrescriptionService p1PrescriptionService;

    /** Recepty zalogowanego użytkownika — właściciel brany z tokenu JWT, nie z URL-a. */
    @GetMapping("/me")
    public List<PrescriptionDto> getMine(Authentication auth) {
        return p1PrescriptionService.getByPatientId(currentUserId(auth));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id, Authentication auth) {
        return p1PrescriptionService.getByIdForUser(id, currentUserId(auth))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{prescriptionId}/pharmacies")
    public List<PharmacyAvailabilityDto> getPharmaciesForPrescription(@PathVariable Long prescriptionId) {
        return p1PrescriptionService.getPharmaciesForPrescription(prescriptionId);
    }

    /** Id użytkownika ustawione przez JwtAuthFilter jako principal (subject tokenu). */
    private static Long currentUserId(Authentication auth) {
        return Long.valueOf(auth.getName());
    }
}
