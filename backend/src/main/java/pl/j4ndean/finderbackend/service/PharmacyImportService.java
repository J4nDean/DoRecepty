package pl.j4ndean.finderbackend.service;

import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.j4ndean.finderbackend.model.Pharmacy;
import pl.j4ndean.finderbackend.repository.PharmacyRepository;

import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PharmacyImportService {

    private final PharmacyRepository pharmacyRepository;

    @PostConstruct
    public void init() {
        pharmacyRepository.deleteAll();
        importFromLocalFile();
    }

    public void importFromLocalFile() {
        String fileName = "Rejestr_Aptek_stan_na_dzien_2026-04-24.csv";
        File file = new File(fileName);

        if (!file.exists()) {
            return;
        }

        try {
            List<Pharmacy> newList = new ArrayList<>();
            
            try (CSVReader reader = new CSVReaderBuilder(
                    new FileReader(file, StandardCharsets.UTF_8))
                    .withCSVParser(new CSVParserBuilder().withSeparator('|').build())
                    .withSkipLines(1)
                    .build()) {
                
                String[] line;
                while ((line = reader.readNext()) != null) {
                    if (line.length < 27) continue;

                    try {
                        String name = line[1].replace("\"", "").trim();
                        if (name.isEmpty()) name = "Apteka";
                        
                        String status = line[2].replace("\"", "").trim();
                        String street = line[23].replace("\"", "").trim();
                        String number = line[24].replace("\"", "").trim();
                        String city = line[26].replace("\"", "").trim();

                        if (!city.isEmpty() && "AKTYWNA".equalsIgnoreCase(status)) {
                            newList.add(Pharmacy.builder()
                                    .name(name)
                                    .address((street + " " + number).trim())
                                    .city(city)
                                    .status(status)
                                    .build());
                        }
                    } catch (Exception e) {}
                }
            }

            if (!newList.isEmpty()) {
                pharmacyRepository.saveAll(newList);
            }
        } catch (Exception e) {}
    }
}
