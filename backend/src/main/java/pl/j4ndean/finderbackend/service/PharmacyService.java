package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyService {
    private final PharmacyRepository pharmacyRepository;

    public List<Pharmacy> searchByCity(String city) {
        // Zwracamy tylko pierwsze 50 rekordów, aby nie przeciążać przeglądarki
        return pharmacyRepository.findByCityContainingIgnoreCase(city, PageRequest.of(0, 50));
    }
    
    public List<Pharmacy> getAll() {
        return pharmacyRepository.findAll();
    }
}
