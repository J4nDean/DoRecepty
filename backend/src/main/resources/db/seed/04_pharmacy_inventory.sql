

-- Leki przeciwbólowe i przeciwgorączkowe
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 30 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Apap', 'Aspirin', 'Ibuprom RR MAX', 'Nurofen Forte');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 20 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Paracetamol Farmina', 'Panadol dla dzieci');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 15 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Ketonal', 'Voltaren', 'Olfen 100 SR');

-- Leki na alergię
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 25 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Allertec', 'Claritine', 'Zyrtec');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 18 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Xyzal', 'Aerius', 'Loratadyna Galena');

-- Leki na astmę i objawy oddechowe
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 20 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Ventolin', 'Pulmicort Turbuhaler', 'Berodual');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 22 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Mucosolvan inhalacje', 'Ambroxol Dr.Max', 'ACC mini');

-- Leki na żołądek i przewód pokarmowy
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 25 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Polprazol', 'Helicid 20', 'Controloc 40');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 20 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Smecta', 'Imodium Instant', 'Espumisan');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 12 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('NO-SPA ampułki', 'Ranigast');

-- Leki kardiologiczne
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 28 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Concor 10', 'Metocard', 'Tritace 2,5');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 26 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Lisinopril Aurovitas', 'Enarenal', 'Amlozek');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 23 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Lacipil', 'Norvasc');

-- Statyny (lipidy)
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 24 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Sortis 20', 'Zocor 10', 'Crestor');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 22 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Atoris');

-- Diabetologia
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 26 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Metformax 500', 'Glucophage XR');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 24 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Metformin Bluefish');

-- Preparaty uzupełniające
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 20 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Cebion', 'Rutinoscorbin', 'Calcium Sandoz + Vitamin C');

-- Pozostałe
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 18 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND m.name IN ('Lakcid', 'Trilac', 'Enterol', 'Sylimarol 35 mg');

-- ============================================================================
-- NASZA APTEKA (Ząbki) — małe apteki z ograniczonym asortymentem
-- ============================================================================

-- Najczęściej kupowane
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 35 FROM pharmacy ph, medication m
WHERE ph.name = 'NASZA APTEKA' AND m.name IN ('Apap', 'Aspirin', 'Paracetamol Farmina');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 25 FROM pharmacy ph, medication m
WHERE ph.name = 'NASZA APTEKA' AND m.name IN ('Allertec', 'Ventolin', 'Concor 10');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 15 FROM pharmacy ph, medication m
WHERE ph.name = 'NASZA APTEKA' AND m.name IN ('Ibuprom RR MAX', 'Claritine', 'Lisinopril Aurovitas');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 12 FROM pharmacy ph, medication m
WHERE ph.name = 'NASZA APTEKA' AND m.name IN ('Smecta', 'Polprazol', 'Sortis 20');

-- Lek dostępny wyłącznie w Aptece Batorego (Ząbki).
INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 14 FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND ph.city = 'Ząbki' AND m.name = 'Vasodol';
