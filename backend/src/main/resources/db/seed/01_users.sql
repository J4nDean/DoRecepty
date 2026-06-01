-- Użytkownicy testowi
-- Hasło obu kont: TestHaslo1!  (hash BCrypt)
INSERT INTO app_user (first_name, last_name, email, password_hash, pesel, role, created_at) VALUES
  ('Jan',  'Kowalski', 'jan.kowalski@dorecepty.test', '$2a$10$nr1R3xBVg/5uWRWzBcoEUOQJO.r58owOzAFb8x9t777ARQTKJkY/S', '44051401458', 'PATIENT', NOW()),
  ('Anna', 'Nowak',    'anna.nowak@dorecepty.test',   '$2a$10$nr1R3xBVg/5uWRWzBcoEUOQJO.r58owOzAFb8x9t777ARQTKJkY/S', '85010112345', 'PATIENT', NOW());
