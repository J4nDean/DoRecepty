-- Przywrócenie sekwencji do 1 (opcjonalnie, zależy od silnika bazy danych, ale bezpieczniej pozwolić bazie zarządzać ID)

-- =========================================================================
-- RECEPTY — Jan Kowalski (Kody 1000 - 1008)
-- =========================================================================
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
SELECT v.package_key, v.access_code, CURRENT_DATE + v.issue_off, CURRENT_DATE + v.exp_off,
       (SELECT id FROM app_user WHERE email = 'jan.kowalski@dorecepty.test'),
       v.doctor_npwz, v.clinic_regon, v.status
FROM (VALUES
  ('PKG-KOW-001', '1001', -2,   28,  '7766554', '123456789', 'ACTIVE'),
  ('PKG-KOW-002', '1002', -1,   364, '7766554', '123456789', 'ACTIVE'),
  ('PKG-KOW-003', '1003', -3,   27,  '9988776', '987654321', 'ACTIVE'),
  ('PKG-KOW-004', '1004', -10,  20,  '7766554', '123456789', 'PARTIALLY_REALIZED'),
  ('PKG-KOW-005', '1005', -120, -90, '7766554', '123456789', 'REALIZED'),
  ('PKG-KOW-006', '1006', -28,  2,   '7766554', '123456789', 'ACTIVE')
) AS v(package_key, access_code, issue_off, exp_off, doctor_npwz, clinic_regon, status);

-- =========================================================================
-- POZYCJE RECEPT — Jan Kowalski
-- =========================================================================
INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, realization_date_from, refund_level, status) VALUES
  -- R1: Concor i Tritace (Kardiologia)
  ((SELECT id FROM prescription WHERE access_code='1001'), 'OID.1001.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Concor 10'), 1, '1 x 1 tabl. rano', NULL, 'ryczałt', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1001'), 'OID.1001.02', 'PL.P1.2026', 2, (SELECT id FROM medication WHERE name='Tritace 2,5'), 1, '1 x 1 tabl. rano', NULL, '30%', 'ACTIVE'),
  -- R2: Metformina (Cukrzyca)
  ((SELECT id FROM prescription WHERE access_code='1002'), 'OID.1002.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Metformina Aurovitas'), 2, '2 x 1 tabl. do posiłku', NULL, '100%', 'ACTIVE'),
  -- R3: Allertec (Alergia)
  ((SELECT id FROM prescription WHERE access_code='1003'), 'OID.1003.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Allertec'), 1, '1 x 1 tabl. wieczorem', NULL, NULL, 'ACTIVE'),
  -- R4: Ventolin (Astma - Częściowo zrealizowana)
  ((SELECT id FROM prescription WHERE access_code='1004'), 'OID.1004.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Ventolin'), 1, 'W razie duszności: 1-2 dawki', NULL, 'ryczałt', 'REALIZED'),
  ((SELECT id FROM prescription WHERE access_code='1004'), 'OID.1004.02', 'PL.P1.2026', 2, (SELECT id FROM medication WHERE name='Pulmicort Turbuhaler'), 1, '1 x 1 dawka rano', NULL, '50%', 'ACTIVE'),
  -- R5: Apap (Przeciwbólowe - Zrealizowana)
  ((SELECT id FROM prescription WHERE access_code='1005'), 'OID.1005.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Apap'), 1, '1 tabl. w razie bólu', NULL, NULL, 'REALIZED'),
  -- R6: Crestor (Lipidy - Wygasająca)
  ((SELECT id FROM prescription WHERE access_code='1006'), 'OID.1006.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Crestor'), 1, '1 x 1 tabl. wieczorem', NULL, '30%', 'ACTIVE');
