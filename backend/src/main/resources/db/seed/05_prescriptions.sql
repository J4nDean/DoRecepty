INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
SELECT v.package_key, v.access_code, CURRENT_DATE + v.issue_off, CURRENT_DATE + v.exp_off,
       (SELECT id FROM app_user WHERE email = 'jan.kowalski@dorecepty.test'),
       v.doctor_npwz, v.clinic_regon, v.status
FROM (VALUES
  ('PKG-KOW-001', '1001', -5,   365, '7766554', '123456789', 'AKTYWNA'),
  ('PKG-KOW-002', '1002', -30,  90,  '7766554', '123456789', 'AKTYWNA'),
  ('PKG-KOW-003', '1003', -25,  5,   '9988776', '987654321', 'AKTYWNA'),
  ('PKG-KOW-004', '1004', -27,  3,   '7766554', '123456789', 'AKTYWNA'),
  ('PKG-KOW-005', '1005', -12,  18,  '9988776', '987654321', 'PARTIALLY_REALIZED'),
  ('PKG-KOW-006', '1006', -5,   25,  '7766554', '123456789', 'PARTIALLY_REALIZED'),
  ('PKG-KOW-007', '1007', -40,  -10, '7766554', '123456789', 'AKTYWNA'),
  ('PKG-KOW-008', '1008', -100, -70, '9988776', '987654321', 'REALIZED')
) AS v(package_key, access_code, issue_off, exp_off, doctor_npwz, clinic_regon, status);

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, realization_date_from, refund_level, status) VALUES
  ((SELECT id FROM prescription WHERE access_code='1001'), 'OID.1001.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Metformina Aurovitas'), 2, '2 x 1 tabl. do posilku', NULL, '100%', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1002'), 'OID.1002.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Concor 10'), 1, '1 x 1 tabl. rano', NULL, 'ryczalt', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1002'), 'OID.1002.02', 'PL.P1.2026', 2, (SELECT id FROM medication WHERE name='Tritace 2,5'), 1, '1 x 1 tabl. rano', NULL, '30%', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1003'), 'OID.1003.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Allertec'), 1, '1 x 1 tabl. wieczorem', NULL, NULL, 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1004'), 'OID.1004.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Crestor'), 1, '1 x 1 tabl. wieczorem', NULL, '30%', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1005'), 'OID.1005.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Ventolin'), 1, 'W razie dusznosci: 1-2 dawki', NULL, 'ryczalt', 'REALIZED'),
  ((SELECT id FROM prescription WHERE access_code='1005'), 'OID.1005.02', 'PL.P1.2026', 2, (SELECT id FROM medication WHERE name='Pulmicort Turbuhaler'), 1, '1 x 1 dawka rano', NULL, '50%', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1006'), 'OID.1006.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Amlozek'), 1, '1 x 1 tabl. rano', NULL, 'ryczalt', 'REALIZED'),
  ((SELECT id FROM prescription WHERE access_code='1006'), 'OID.1006.02', 'PL.P1.2026', 2, (SELECT id FROM medication WHERE name='Bisoprolol VP'), 1, '1 x 1 tabl. rano', NULL, 'ryczalt', 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1007'), 'OID.1007.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Olfen 100 SR'), 1, '1 x 1 kaps. do jedzenia', NULL, NULL, 'ACTIVE'),
  ((SELECT id FROM prescription WHERE access_code='1008'), 'OID.1008.01', 'PL.P1.2026', 1, (SELECT id FROM medication WHERE name='Apap'), 1, '1 tabl. w razie bolu, max 4 x dziennie', NULL, NULL, 'REALIZED');
