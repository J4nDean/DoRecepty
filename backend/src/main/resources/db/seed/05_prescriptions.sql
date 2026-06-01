    -- Dane demo: dwóch użytkowników testowych + kompletny zbiór recept dla każdego.
-- Zgodne ze schematem tabel APP_USER, PRESCRIPTION, PRESCRIPTION_ITEM.
-- Hasło obu kont: TestHaslo1!  (hash BCrypt $2a$10$...).
--
-- Zbiór recept pokrywa WSZYSTKIE elementy systemu:
--   statusy recepty:  ACTIVE, PARTIALLY_REALIZED, REALIZED, EXPIRED, CANCELLED
--   statusy pozycji:  ACTIVE, REALIZED, EXPIRED, CANCELLED
--   poziomy refundacji: bezpłatny, 30%, 50%, ryczałt, 100%, NULL (pełnopłatny)
--   recepty jedno- i wielopozycyjne, "data realizacji: od" w przyszłości oraz pusta.

-- =========================================================================
-- UŻYTKOWNICY
-- =========================================================================
INSERT INTO app_user (first_name, last_name, email, password_hash, pesel, role, created_at) VALUES
  ('Jan',  'Kowalski', 'jan.kowalski@dorecepty.test', '$2a$10$nr1R3xBVg/5uWRWzBcoEUOQJO.r58owOzAFb8x9t777ARQTKJkY/S', '44051401458', 'PATIENT', NOW()),
  ('Anna', 'Nowak',    'anna.nowak@dorecepty.test',   '$2a$10$nr1R3xBVg/5uWRWzBcoEUOQJO.r58owOzAFb8x9t777ARQTKJkY/S', '85010112345', 'PATIENT', NOW());

-- =========================================================================
-- RECEPTY — Jan Kowalski (klucze PKG-KOWALSKI-NN)
-- =========================================================================
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
SELECT v.package_key, v.access_code, CURRENT_DATE + v.issue_off, CURRENT_DATE + v.exp_off,
       (SELECT id FROM app_user WHERE email = 'jan.kowalski@dorecepty.test'),
       v.doctor_npwz, v.clinic_regon, v.status
FROM (VALUES
  ('PKG-KOWALSKI-01', '2341', -5,   25,  '1234567', '123456789', 'ACTIVE'),
  ('PKG-KOWALSKI-02', '2352', -1,   364, '1234567', '123456789', 'ACTIVE'),
  ('PKG-KOWALSKI-03', '2363', -3,   27,  '7654321', '987654321', 'ACTIVE'),
  ('PKG-KOWALSKI-04', '2374', -7,   23,  '7654321', '987654321', 'ACTIVE'),
  ('PKG-KOWALSKI-05', '5510', -10,  20,  '1234567', '123456789', 'PARTIALLY_REALIZED'),
  ('PKG-KOWALSKI-06', '8810', -120, -90, '1234567', '123456789', 'REALIZED'),
  ('PKG-KOWALSKI-07', '7720', -60,  -5,  '7654321', '987654321', 'EXPIRED'),
  ('PKG-KOWALSKI-08', '8843', -30,  0,   '7654321', '987654321', 'CANCELLED'),
  ('PKG-KOWALSKI-09', '9001', -28,  2,   '1234567', '123456789', 'ACTIVE')
) AS v(package_key, access_code, issue_off, exp_off, doctor_npwz, clinic_regon, status);

-- =========================================================================
-- RECEPTY — Anna Nowak (klucze PKG-NOWAK-NN)
-- =========================================================================
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
SELECT v.package_key, v.access_code, CURRENT_DATE + v.issue_off, CURRENT_DATE + v.exp_off,
       (SELECT id FROM app_user WHERE email = 'anna.nowak@dorecepty.test'),
       v.doctor_npwz, v.clinic_regon, v.status
FROM (VALUES
  ('PKG-NOWAK-01', '2341', -5,   25,  '1234567', '123456789', 'ACTIVE'),
  ('PKG-NOWAK-02', '2352', -1,   364, '1234567', '123456789', 'ACTIVE'),
  ('PKG-NOWAK-03', '2363', -3,   27,  '7654321', '987654321', 'ACTIVE'),
  ('PKG-NOWAK-04', '2374', -7,   23,  '7654321', '987654321', 'ACTIVE'),
  ('PKG-NOWAK-05', '5510', -10,  20,  '1234567', '123456789', 'PARTIALLY_REALIZED'),
  ('PKG-NOWAK-06', '8810', -120, -90, '1234567', '123456789', 'REALIZED'),
  ('PKG-NOWAK-07', '7720', -60,  -5,  '7654321', '987654321', 'EXPIRED'),
  ('PKG-NOWAK-08', '8843', -30,  0,   '7654321', '987654321', 'CANCELLED')
) AS v(package_key, access_code, issue_off, exp_off, doctor_npwz, clinic_regon, status);

-- =========================================================================
-- POZYCJE RECEPT — Jan Kowalski
-- realization_date_from: CURRENT_DATE + N gdy realizacja "od" w przyszłości, inaczej NULL
-- =========================================================================
INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, realization_date_from, refund_level, status) VALUES
  -- R1 ACTIVE, wielopozycyjna, różne refundacje
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-01'), 'PL.CSIOZ.KOW.R01.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Concor 10'),            1, '1 x 1 tabl. rano',                     NULL,             'ryczałt',   'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-01'), 'PL.CSIOZ.KOW.R01.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Tritace 2,5'),          1, '1 x 1 tabl. rano',                     NULL,             '30%',       'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-01'), 'PL.CSIOZ.KOW.R01.I03', 'PL.CSIOZ.2024', 3, (SELECT id FROM medication WHERE name='Lisinopril Aurovitas'),  1, '1 x 1 tabl. wieczorem',                NULL,             '50%',       'ACTIVE'),
  -- R2 ACTIVE, 100% + realizacja od przyszłości
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-02'), 'PL.CSIOZ.KOW.R02.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Metformina Aurovitas'),  2, '2 x 1 tabl. do posiłku',               CURRENT_DATE + 3, '100%',      'ACTIVE'),
  -- R3 ACTIVE, pełnopłatny (refund NULL)
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-03'), 'PL.CSIOZ.KOW.R03.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Allertec'),             1, '1 x 1 tabl. wieczorem',                NULL,             NULL,        'ACTIVE'),
  -- R4 ACTIVE, bezpłatny (senior 65+)
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-04'), 'PL.CSIOZ.KOW.R04.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Polprazol'),            2, '1 x 1 kaps. rano przed śniadaniem',    NULL,             'bezpłatny', 'ACTIVE'),
  -- R5 PARTIALLY_REALIZED, jedna pozycja wydana
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-05'), 'PL.CSIOZ.KOW.R05.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Ventolin'),             1, 'W razie duszności: 1-2 dawki wziewne', NULL,             'ryczałt',   'REALIZED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-05'), 'PL.CSIOZ.KOW.R05.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Bezolen'),              1, '1 x 1 tabl. wieczorem',                NULL,             '50%',       'ACTIVE'),
  -- R6 REALIZED, w całości wydana
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-06'), 'PL.CSIOZ.KOW.R06.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Apap'),                 1, '1 tabl. w razie bólu',                 NULL,             NULL,        'REALIZED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-06'), 'PL.CSIOZ.KOW.R06.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Ibuprom RR MAX'),       1, '1 x 1 tabl. po posiłku',               NULL,             NULL,        'REALIZED'),
  -- R7 EXPIRED
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-07'), 'PL.CSIOZ.KOW.R07.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Sortis 20'),            1, '1 x 1 tabl. wieczorem',                NULL,             '30%',       'EXPIRED'),
  -- R8 CANCELLED
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-08'), 'PL.CSIOZ.KOW.R08.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Norvasc'),              1, '1 x 1 tabl. wieczorem',                NULL,             'ryczałt',   'CANCELLED'),
  -- R9 ACTIVE, wkrótce wygasa (ważność za 2 dni)
  ((SELECT id FROM prescription WHERE package_key='PKG-KOWALSKI-09'), 'PL.CSIOZ.KOW.R09.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Crestor'),              1, '1 x 1 tabl. wieczorem',                NULL,             '30%',       'ACTIVE');

-- =========================================================================
-- POZYCJE RECEPT — Anna Nowak
-- =========================================================================
INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, realization_date_from, refund_level, status) VALUES
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-01'), 'PL.CSIOZ.NOW.R01.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Concor 10'),            1, '1 x 1 tabl. rano',                     NULL,             'ryczałt',   'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-01'), 'PL.CSIOZ.NOW.R01.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Tritace 2,5'),          1, '1 x 1 tabl. rano',                     NULL,             '30%',       'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-01'), 'PL.CSIOZ.NOW.R01.I03', 'PL.CSIOZ.2024', 3, (SELECT id FROM medication WHERE name='Lisinopril Aurovitas'),  1, '1 x 1 tabl. wieczorem',                NULL,             '50%',       'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-02'), 'PL.CSIOZ.NOW.R02.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Metformina Aurovitas'),  2, '2 x 1 tabl. do posiłku',               CURRENT_DATE + 3, '100%',      'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-03'), 'PL.CSIOZ.NOW.R03.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Allertec'),             1, '1 x 1 tabl. wieczorem',                NULL,             NULL,        'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-04'), 'PL.CSIOZ.NOW.R04.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Polprazol'),            2, '1 x 1 kaps. rano przed śniadaniem',    NULL,             'bezpłatny', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-05'), 'PL.CSIOZ.NOW.R05.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Ventolin'),             1, 'W razie duszności: 1-2 dawki wziewne', NULL,             'ryczałt',   'REALIZED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-05'), 'PL.CSIOZ.NOW.R05.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Bezolen'),              1, '1 x 1 tabl. wieczorem',                NULL,             '50%',       'ACTIVE'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-06'), 'PL.CSIOZ.NOW.R06.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Apap'),                 1, '1 tabl. w razie bólu',                 NULL,             NULL,        'REALIZED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-06'), 'PL.CSIOZ.NOW.R06.I02', 'PL.CSIOZ.2024', 2, (SELECT id FROM medication WHERE name='Ibuprom RR MAX'),       1, '1 x 1 tabl. po posiłku',               NULL,             NULL,        'REALIZED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-07'), 'PL.CSIOZ.NOW.R07.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Sortis 20'),            1, '1 x 1 tabl. wieczorem',                NULL,             '30%',       'EXPIRED'),
  ((SELECT id FROM prescription WHERE package_key='PKG-NOWAK-08'), 'PL.CSIOZ.NOW.R08.I01', 'PL.CSIOZ.2024', 1, (SELECT id FROM medication WHERE name='Norvasc'),              1, '1 x 1 tabl. wieczorem',                NULL,             'ryczałt',   'CANCELLED');
