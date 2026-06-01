-- ═══════════════════════════════════════════════════════════════════════════
--  RECEPTY DEMO (patient_id = 1)
--  Każdy inny użytkownik widzi tylko swoje recepty pobierane przez /prescriptions/me
-- ═══════════════════════════════════════════════════════════════════════════
DELETE FROM prescription_item WHERE prescription_id IN (
    SELECT id FROM prescription WHERE patient_id = 1
);
DELETE FROM prescription WHERE patient_id = 1;

-- Recepta 1: Nadciśnienie tętnicze
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240531000000000000000000000000000000001001', '2341', CURRENT_DATE - 5, CURRENT_DATE + 25, 1, '1234567', '123456789', 'ACTIVE');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10010000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 x 1 tabl. rano', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Concor 10' WHERE p.access_code = '2341';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10010000000002', 'PL.CSIOZ.2024', 2, m.id, 1, '1 x 1 tabl. rano', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Lisinopril Aurovitas' WHERE p.access_code = '2341';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10010000000003', 'PL.CSIOZ.2024', 3, m.id, 1, '1 x 1 tabl. rano', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Tritace 2,5' WHERE p.access_code = '2341';

-- Recepta 2: Alergia + Astma
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240531000000000000000000000000000000001002', '3456', CURRENT_DATE - 2, CURRENT_DATE + 28, 1, '7654321', '987654321', 'ACTIVE');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10020000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 x 1 tabl. wieczorem', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Allertec' WHERE p.access_code = '3456';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10020000000002', 'PL.CSIOZ.2024', 2, m.id, 1, 'W razie napadu duszności: 1-2 dawki wziewne', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Ventolin' WHERE p.access_code = '3456';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10020000000003', 'PL.CSIOZ.2024', 3, m.id, 1, '1 x 1 tabl. wieczorem', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Bezolen' WHERE p.access_code = '3456';

-- Recepta archiwalna 1: bóle głowy
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240101000000000000000000000000000000009001', '8810', CURRENT_DATE - 120, CURRENT_DATE - 90, 1, '1234567', '123456789', 'REALIZED');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.90010000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 tabl. w razie bólu', 'REALIZED'
FROM prescription p JOIN medication m ON m.name = 'Apap' WHERE p.access_code = '8810';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.90010000000002', 'PL.CSIOZ.2024', 2, m.id, 1, '1 x 1 tabl. po posiłku', 'REALIZED'
FROM prescription p JOIN medication m ON m.name = 'Ibuprom RR MAX' WHERE p.access_code = '8810';

-- Recepta archiwalna 2: refluks
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240101000000000000000000000000000000009002', '8821', CURRENT_DATE - 95, CURRENT_DATE - 65, 1, '7654321', '987654321', 'REALIZED');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.90020000000001', 'PL.CSIOZ.2024', 1, m.id, 2, '1 x 1 kaps. rano przed śniadaniem', 'REALIZED'
FROM prescription p JOIN medication m ON m.name = 'Polprazol' WHERE p.access_code = '8821';

-- Recepta archiwalna 3: cholesterol
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240101000000000000000000000000000000009003', '8832', CURRENT_DATE - 180, CURRENT_DATE - 150, 1, '1234567', '123456789', 'ARCHIVED');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.90030000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 x 1 tabl. wieczorem', 'REALIZED'
FROM prescription p JOIN medication m ON m.name = 'Sortis 20' WHERE p.access_code = '8832';

-- Recepta archiwalna 4: anulowana
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240101000000000000000000000000000000009004', '8843', CURRENT_DATE - 60, CURRENT_DATE - 30, 1, '7654321', '987654321', 'CANCELLED');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.90040000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 x 1 tabl. wieczorem', 'CANCELLED'
FROM prescription p JOIN medication m ON m.name = 'Norvasc' WHERE p.access_code = '8843';

-- Recepta wygasająca za 7 dni (test powiadomienia)
INSERT INTO prescription (package_key, access_code, issue_date, expiration_date, patient_id, doctor_npwz, clinic_regon, status)
VALUES ('20240531000000000000000000000000000000001003', '9977', CURRENT_DATE - 23, CURRENT_DATE + 7, 1, '1234567', '123456789', 'ACTIVE');

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10030000000001', 'PL.CSIOZ.2024', 1, m.id, 1, '1 x 1 tabl. rano', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Metformina Aurovitas' WHERE p.access_code = '9977';

INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix, position_in_package, medication_id, quantity, dosage_instructions, status)
SELECT p.id, 'PL.CSIOZ.2024.10030000000002', 'PL.CSIOZ.2024', 2, m.id, 1, '1 x 1 tabl. wieczorem', 'ACTIVE'
FROM prescription p JOIN medication m ON m.name = 'Sortis 20' WHERE p.access_code = '9977';
