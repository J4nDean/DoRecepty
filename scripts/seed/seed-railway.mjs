// Seed bazy Postgres na Railway — czysty pg, bez Prisma.
// Uruchom:
//   DATABASE_URL="postgresql://postgres:HASLO@host.proxy.rlwy.net:PORT/railway" node seed-railway.mjs
//
// Co robi:
//   1. Czyści tabele recept i użytkowników (FK-safe).
//   2. Upewnia się, że istnieją potrzebne leki (nie rusza reszty katalogu).
//   3. Tworzy jednego użytkownika testowego (hasło bcrypt).
//   4. Tworzy recepty przypisane do użytkownika — właściciel wyszukiwany po PESEL.

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Brak zmiennej DATABASE_URL. Podaj connection string do bazy Railway.');
  process.exit(1);
}

// --- Użytkownik testowy ---
// PESEL 44051401458 = ten sam, na który jesteś teraz zalogowany (Jan Demo),
// więc recepty pojawią się od razu, bez ponownego logowania.
const USER = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan.kowalski@dorecepty.test',
  plainPassword: 'TestHaslo1!', // 8+ znaków, mała+wielka litera, cyfra, znak specjalny
  pesel: '44051401458',
};

// --- Leki, których wymagają recepty (upsert po nazwie) ---
const MEDICATIONS = [
  { name: 'Concor 10', commonName: 'Bisoprololum', strength: '10 mg', form: 'Tabletki powlekane', pkg: '30 tabl.' },
  { name: 'Apap', commonName: 'Paracetamolum', strength: '500 mg', form: 'Tabletki powlekane', pkg: '2 tabl.' },
  { name: 'Sortis 20', commonName: 'Atorvastatinum', strength: '20 mg', form: 'Tabletki powlekane', pkg: '30 tabl.' },
];

// --- Recepty ---
const PRESCRIPTIONS = [
  {
    accessCode: '2341', issueOffset: -5, expirationOffset: 25,
    doctorNpwz: '1234567', clinicRegon: '123456789', status: 'ACTIVE',
    items: [{ med: 'Concor 10', qty: 1, dosage: '1 x 1 tabl. rano', status: 'ACTIVE' }],
  },
  {
    accessCode: '8810', issueOffset: -120, expirationOffset: -90,
    doctorNpwz: '1234567', clinicRegon: '123456789', status: 'REALIZED',
    items: [{ med: 'Apap', qty: 1, dosage: '1 tabl. w razie bólu', status: 'REALIZED' }],
  },
  {
    accessCode: '9977', issueOffset: -23, expirationOffset: 7,
    doctorNpwz: '1234567', clinicRegon: '123456789', status: 'ACTIVE',
    items: [{ med: 'Sortis 20', qty: 1, dosage: '1 x 1 tabl. wieczorem', status: 'ACTIVE' }],
  },
];

const client = new Client({
  connectionString: DATABASE_URL,
  // Railway wymaga TLS, ale używa certyfikatów, których Node domyślnie nie zna.
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  // 1. Czyszczenie — kolejność ze względu na klucze obce.
  console.log('[1/4] Czyszczę tabele recept i użytkowników…');
  await client.query('TRUNCATE prescription_item, prescription, app_user RESTART IDENTITY CASCADE');

  // 2. Leki — upsert po nazwie (nie kasujemy istniejącego katalogu).
  console.log('[2/4] Upewniam się, że potrzebne leki istnieją…');
  for (const m of MEDICATIONS) {
    await client.query(
      `INSERT INTO medication (name, common_name, strength, pharmaceutical_form, package_size, prescription_category)
       VALUES ($1, $2, $3, $4, $5, 'Rp')
       ON CONFLICT (name) DO NOTHING`,
      [m.name, m.commonName, m.strength, m.form, m.pkg]
    );
  }

  // 3. Użytkownik testowy z hasłem bcrypt.
  console.log('[3/4] Tworzę użytkownika testowego…');
  const passwordHash = await bcrypt.hash(USER.plainPassword, 10);
  const userRes = await client.query(
    `INSERT INTO app_user (first_name, last_name, email, password_hash, pesel, role, created_at)
     VALUES ($1, $2, $3, $4, $5, 'PATIENT', NOW())
     RETURNING id`,
    [USER.firstName, USER.lastName, USER.email, passwordHash, USER.pesel]
  );
  const userId = userRes.rows[0].id;

  // 4. Recepty — właściciel ustalany przez wyszukanie po PESEL.
  console.log('[4/4] Tworzę recepty (właściciel po PESEL)…');
  const ownerRes = await client.query('SELECT id FROM app_user WHERE pesel = $1', [USER.pesel]);
  if (ownerRes.rowCount === 0) throw new Error(`Nie znaleziono użytkownika o PESEL ${USER.pesel}`);
  const ownerId = ownerRes.rows[0].id;

  let recipeNum = 0;
  for (const p of PRESCRIPTIONS) {
    recipeNum++;
    const presRes = await client.query(
      `INSERT INTO prescription (package_key, access_code, issue_date, expiration_date,
                                 patient_id, doctor_npwz, clinic_regon, status)
       VALUES ($1, $2, CURRENT_DATE + $3, CURRENT_DATE + $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        `PKG-${USER.pesel}-${String(recipeNum).padStart(4, '0')}`,
        p.accessCode, p.issueOffset, p.expirationOffset,
        ownerId, p.doctorNpwz, p.clinicRegon, p.status,
      ]
    );
    const prescriptionId = presRes.rows[0].id;

    let pos = 0;
    for (const it of p.items) {
      pos++;
      // Łączymy pozycję z lekiem po nazwie (SELECT m.id ... WHERE m.name = ...).
      await client.query(
        `INSERT INTO prescription_item (prescription_id, prescription_oid, oid_prefix,
                                        position_in_package, medication_id, quantity,
                                        dosage_instructions, status)
         SELECT $1, $2, 'PL.CSIOZ.2024', $3, m.id, $4, $5, $6
         FROM medication m WHERE m.name = $7`,
        [
          prescriptionId,
          `PL.CSIOZ.U${USER.pesel}.R${recipeNum}.I${pos}`,
          pos, it.qty, it.dosage, it.status, it.med,
        ]
      );
    }
  }

  console.log('\nGotowe ✓');
  console.log(`  Użytkownik id=${userId}`);
  console.log(`  Login: ${USER.email}`);
  console.log(`  Hasło: ${USER.plainPassword}`);
  console.log(`  PESEL: ${USER.pesel}`);
  console.log(`  Recepty: ${PRESCRIPTIONS.length}`);
}

main()
  .catch((e) => { console.error('Seed nie powiódł się:', e); process.exitCode = 1; })
  .finally(() => client.end());
