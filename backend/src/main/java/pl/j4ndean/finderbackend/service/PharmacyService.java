package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyService {

    private final PharmacyRepository pharmacies;

    public List<Pharmacy> getAllPharmacies() {
        return pharmacies.findAll();
    }

    public List<Pharmacy> searchPharmacies(String query) {
        if (query == null || query.isBlank()) {
            return pharmacies.findAll(PageRequest.of(0, 1000)).getContent();
        }
        return pharmacies.findByNameOrCityOrAddress(query);
    }

    public List<Pharmacy> getInBounds(double north, double south, double east, double west) {
        return pharmacies.findInBoundingBox(south, north, west, east);
    }

    public Pharmacy createPharmacy(Pharmacy pharmacy) {
        pharmacy.setId(null);
        if (pharmacy.getStatus() == null || pharmacy.getStatus().isBlank()) {
            pharmacy.setStatus("ACTIVE");
        }
        return pharmacies.save(pharmacy);
    }

    public Pharmacy updatePharmacy(Long id, Pharmacy update) {
        Pharmacy existing = pharmacies.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Apteka nie istnieje"));
        BeanUtils.copyProperties(update, existing, "id");
        return pharmacies.save(existing);
    }

    public void updateLocation(Pharmacy update) {
        pharmacies.findByCityContainingIgnoreCase(update.getCity()).stream()
                .filter(p -> p.getAddress().equalsIgnoreCase(update.getAddress()))
                .findFirst()
                .ifPresent(existing -> {
                    existing.setLatitude(update.getLatitude());
                    existing.setLongitude(update.getLongitude());
                    pharmacies.save(existing);
                });
    }
}
