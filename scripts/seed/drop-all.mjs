// DESTRUKCYJNE: usuwa CAŁY schemat public na bazie Railway i tworzy go pusty.
// Po tym zrestartuj backend — Hibernate (ddl-auto=update) odtworzy tabele wg encji,
// a DataSeeder napełni je danymi (apteki, leki, user testowy, recepty).
//
// Uruchom:  $env:DATABASE_URL="postgresql://..."; node drop-all.mjs
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('Brak DATABASE_URL'); process.exit(1); }

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  const before = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' ORDER BY table_name`);
  console.log('Tabele przed:', before.rows.map(r => r.table_name).join(', ') || '(brak)');

  console.log('Usuwam schemat public…');
  await client.query('DROP SCHEMA public CASCADE');
  await client.query('CREATE SCHEMA public');
  // Przywróć domyślne uprawnienia (Railway loguje się jako właściciel/superuser).
  await client.query('GRANT ALL ON SCHEMA public TO public');

  const after = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
  console.log('Tabele po:', after.rows.map(r => r.table_name).join(', ') || '(pusto ✓)');
  console.log('\nGotowe ✓  Zredeployuj/zrestartuj backend — odtworzy schemat i zaseeduje dane.');
}

main().catch(e => { console.error('Drop nie powiódł się:', e.message); process.exitCode = 1; })
      .finally(() => client.end());
