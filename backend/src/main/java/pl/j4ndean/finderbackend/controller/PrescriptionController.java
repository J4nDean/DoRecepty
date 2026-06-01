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

    @GetMapping("/me")
    public List<PrescriptionDto> getMine(Authentication auth) {
        Long userId = Long.parseLong(auth.getPrincipal().toString());
        return p1PrescriptionService.getByUserId(userId);
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id) {
        return p1PrescriptionService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{prescriptionId}/pharmacies")
    public List<PharmacyAvailabilityDto> getPharmaciesForPrescription(@PathVariable Long prescriptionId) {
        return p1PrescriptionService.getPharmaciesForPrescription(prescriptionId);
    }
}
