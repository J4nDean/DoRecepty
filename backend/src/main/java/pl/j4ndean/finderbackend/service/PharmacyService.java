package pl.j4ndean.finderbackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyService {
    private final PharmacyRepository pharmacyRepository;

    public List<Pharmacy> searchByCity(String city) {
        return pharmacyRepository.findByCityContainingIgnoreCase(city);
    }
    
    public List<Pharmacy> getAll() {
        return pharmacyRepository.findAll();
    }
}
