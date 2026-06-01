// READ-ONLY diagnostyka schematu/danych na Railway.
// Uruchom:  $env:DATABASE_URL="postgresql://..."; node diagnose.mjs
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Brak DATABASE_URL'); process.exit(1); }

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Kolumny, których oczekują encje JPA — porównamy z rzeczywistością.
const EXPECTED = {
  prescription_item: ['id','prescription_id','prescription_oid','oid_prefix','position_in_package',
                      'medication_id','quantity','dosage_instructions','realization_date_from','refund_level','status'],
  medication:        ['id','gtin','name','common_name','strength','pharmaceutical_form','package_size','atc_code','prescription_category'],
  prescription:      ['id','package_key','access_code','issue_date','expiration_date','patient_id','doctor_npwz','clinic_regon','status'],
  app_user:          ['id','first_name','last_name','email','password_hash','pesel','role','created_at'],
};

async function cols(table) {
  const r = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
  return r.rows;
}

async function main() {
  await client.connect();
  for (const [table, expected] of Object.entries(EXPECTED)) {
    const rows = await cols(table);
    const have = rows.map(r => r.column_name);
    const missing = expected.filter(c => !have.includes(c));
    console.log(`\n=== ${table} ===`);
    console.log('  kolumny w bazie:', have.join(', ') || '(BRAK TABELI)');
    console.log('  BRAKUJĄCE wg encji JPA:', missing.length ? '❌ ' + missing.join(', ') : '✓ żadne');
  }

  // Liczność
  for (const t of ['app_user','prescription','prescription_item','medication']) {
    try {
      const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
      console.log(`\nliczba rekordów ${t}: ${r.rows[0].n}`);
    } catch (e) { console.log(`\nliczba rekordów ${t}: błąd ${e.message}`); }
  }

  // Odtworzenie dokładnego zapytania o pozycje pierwszej recepty (to ono wywala 500).
  console.log('\n=== Test zapytania o pozycje recepty (jak findByPrescriptionId) ===');
  try {
    const p = await client.query(`SELECT id FROM prescription ORDER BY id LIMIT 1`);
    if (p.rowCount === 0) { console.log('  brak recept w bazie'); }
    else {
      const pid = p.rows[0].id;
      const r = await client.query(
        `SELECT pi.*, m.name AS med_name FROM prescription_item pi
         JOIN medication m ON m.id = pi.medication_id
         WHERE pi.prescription_id = $1 ORDER BY pi.position_in_package`, [pid]);
      console.log(`  recepta id=${pid}: ${r.rowCount} pozycji — zapytanie OK`);
    }
  } catch (e) {
    console.log('  ❌ BŁĄD zapytania:', e.message);
  }
}

main().catch(e => { console.error('Diagnostyka nie powiodła się:', e.message); process.exitCode = 1; })
      .finally(() => client.end());
