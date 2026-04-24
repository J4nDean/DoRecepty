# Finder - System E-recept i Mapy Aptek

Projekt integrujący system e-recept (P1 Mock) z interaktywną mapą aptek.

## Technologie
- **Backend**: Spring Boot 3.x, Java 21, Maven, JPA, H2 Database, Spring Security.
- **Frontend**: React.js, Tailwind CSS, Lucide React, Axios, React Router.

## Struktura Projektu
- `/backend`: Aplikacja Spring Boot udostępniająca REST API.
- `/frontend`: Aplikacja React (Vite) z interfejsem użytkownika.

## Jak uruchomić

### 1. Backend
Wymagania: JDK 21+, Maven.
```bash
cd backend
./mvnw spring-boot:run
```
API będzie dostępne pod adresem: `http://localhost:8080`
Konsola H2: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:testdb`, User: `sa`, Password: )

### 2. Frontend
Wymagania: Node.js 18+.
```bash
cd frontend
npm install
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:5173` (lub `http://localhost:3000` zależnie od konfiguracji Vite).

## Funkcjonalności
1. **Login Page**: Ekran logowania (dawny Home).
2. **Patient Dashboard**: Nowa strona główna z listą e-recept.
3. **Pharmacy Map**: Interaktywna wyszukiwarka aptek z filtrowaniem po mieście.
4. **Mock P1 Service**: Automatyczne pobieranie recept dla numeru PESEL.
