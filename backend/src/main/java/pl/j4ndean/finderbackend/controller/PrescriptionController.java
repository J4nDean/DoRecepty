package pl.j4ndean.finderbackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import pl.j4ndean.finderbackend.dto.AppMetadata;
import pl.j4ndean.finderbackend.dto.PharmacyAvailabilityDto;
import pl.j4ndean.finderbackend.dto.PrescriptionDto;
import pl.j4ndean.finderbackend.service.PrescriptionService;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    private static final AppMetadata METADATA = AppMetadata.build();

    @GetMapping("/metadata")
    public AppMetadata getMetadata() {
        return METADATA;
    }

    @GetMapping("/me")
    public List<PrescriptionDto> getMine(Authentication auth) {
        return prescriptionService.getUserPrescriptions(Long.valueOf(auth.getName()));
    }

    @GetMapping("/detail/{id}")
    public ResponseEntity<PrescriptionDto> getById(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(prescriptionService.getPrescriptionDetail(id, Long.valueOf(auth.getName())));
    }

    @GetMapping("/{prescriptionId}/pharmacies")
    public List<PharmacyAvailabilityDto> getPharmacies(@PathVariable Long prescriptionId) {
        return prescriptionService.getPharmacyAvailability(prescriptionId);
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<PrescriptionDto> archive(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(prescriptionService.archivePrescription(id, Long.valueOf(auth.getName())));
    }
}
