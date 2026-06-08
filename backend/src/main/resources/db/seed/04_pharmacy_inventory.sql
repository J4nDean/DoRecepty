INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 50
FROM pharmacy ph, medication m
WHERE ph.name = 'DR. OPTIMA' AND ph.city = 'Warszawa'
AND m.name IN ('Concor 10', 'Tritace 2,5', 'Metformina Aurovitas', 'Allertec', 'Ventolin', 'Pulmicort Turbuhaler', 'Apap', 'Crestor');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 50
FROM pharmacy ph, medication m
WHERE ph.name = 'Apteka Batorego' AND ph.city = 'Ząbki'
AND m.name IN ('Concor 10', 'Tritace 2,5', 'Metformina Aurovitas', 'Allertec', 'Ventolin', 'Pulmicort Turbuhaler', 'Apap', 'Crestor');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 25
FROM pharmacy ph, medication m
WHERE ph.name = 'NASZA APTEKA' AND ph.city = 'Ząbki'
AND m.name IN ('Concor 10', 'Metformina Aurovitas', 'Allertec', 'Ventolin', 'Apap');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, 100
FROM pharmacy ph, medication m
WHERE ph.name = 'SUPER-PHARM' AND ph.address LIKE '%Malborska%'
AND m.name IN ('Apap', 'Allertec');

INSERT INTO pharmacy_inventory (pharmacy_id, medication_id, stock_quantity)
SELECT ph.id, m.id, floor(random() * 10 + 1)::int
FROM pharmacy ph, medication m
WHERE ph.id % 20 = 0 AND m.id % 5 = 0;
