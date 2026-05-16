#!/usr/bin/env node
/**
 * Geocodes every public/over-the-counter pharmacy in apteki_warszawa_zabki.sql
 * via the Google Maps Geocoding API and writes coordinates to
 * backend/src/main/resources/pharmacy_coords.json.
 *
 * Resumable: re-running skips entries already in the JSON file.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=AIza... node scripts/geocode-pharmacies.mjs
 *
 * Filter mirrors PharmacyImportService.java:
 *   stan_apteki = 'AKTYWNA'
 *   AND rodzaj_apteki IN ('APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY')
 *
 * Key format ("name|address") matches the lookup in PharmacyImportService.migrateFromApteki.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const SQL_PATH  = join(REPO_ROOT, 'backend/src/main/resources/apteki_warszawa_zabki.sql');
const OUT_PATH  = join(REPO_ROOT, 'backend/src/main/resources/pharmacy_coords.json');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY env var.');
  process.exit(1);
}

const REQUEST_DELAY_MS = 200;          // ~5 req/sec — well under Google's 50 req/sec quota
const SAVE_EVERY       = 10;            // persist progress every N successful geocodes

// ── SQL parsing ──────────────────────────────────────────────────────────────

const sql = readFileSync(SQL_PATH, 'utf8');

// Column order matches the CREATE TABLE in apteki_warszawa_zabki.sql.
const COL = {
  nazwa_apteki:    1,
  stan_apteki:     2,
  rodzaj_apteki:   3,
  typ_ulicy:       22,
  nazwa_ulicy:     23,
  numer_budynku:   24,
  miejscowosc:     26,
};

function parseValues(line) {
  const m = line.match(/^INSERT INTO apteki VALUES \((.*)\);\s*$/);
  if (!m) return null;
  const out = [];
  // Each value is single-quoted; SQL doubles embedded quotes ('') for escaping.
  const re = /'((?:[^']|'')*)'/g;
  let match;
  while ((match = re.exec(m[1])) !== null) {
    out.push(match[1].replace(/''/g, "'"));
  }
  return out;
}

// Mirrors the address-building logic in PharmacyImportService.migrateFromApteki
// so the resulting key matches the Java lookup.
function buildKey(values) {
  const name   = (values[COL.nazwa_apteki]  || '').trim();
  const typ    = (values[COL.typ_ulicy]     || '').trim();
  const nazwa  = (values[COL.nazwa_ulicy]   || '').trim();
  const numer  = (values[COL.numer_budynku] || '').trim();
  const street = `${typ} ${nazwa}`.trim();
  const address = `${street} ${numer}`.trim();
  return { name, address, key: `${name}|${address}` };
}

const PUBLIC_TYPES = new Set(['APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY']);

const pharmacies = [];
for (const line of sql.split('\n')) {
  if (!line.startsWith('INSERT INTO apteki')) continue;
  const values = parseValues(line);
  if (!values) continue;
  if (values[COL.stan_apteki] !== 'AKTYWNA') continue;
  if (!PUBLIC_TYPES.has(values[COL.rodzaj_apteki])) continue;
  const { name, address, key } = buildKey(values);
  const city = (values[COL.miejscowosc] || '').trim();
  if (!name || !address || !city) continue;
  pharmacies.push({ key, name, address, city });
}

console.log(`Parsed ${pharmacies.length} public pharmacies from SQL.`);

// ── Load existing coords (resume support) ────────────────────────────────────

let coords = {};
if (existsSync(OUT_PATH)) {
  try {
    coords = JSON.parse(readFileSync(OUT_PATH, 'utf8'));
    console.log(`Loaded ${Object.keys(coords).length} existing coordinates — skipping those.`);
  } catch {
    console.warn('Existing pharmacy_coords.json is malformed — starting fresh.');
    coords = {};
  }
}

const todo = pharmacies.filter(p => !coords[p.key]);
console.log(`${todo.length} pharmacies need geocoding.`);

// ── Geocode loop ─────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const save  = () => writeFileSync(OUT_PATH, JSON.stringify(coords, null, 2) + '\n', 'utf8');

let ok = 0, fail = 0;

for (let i = 0; i < todo.length; i++) {
  const p = todo[i];
  const query = `${p.address}, ${p.city}, Poland`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json`
    + `?address=${encodeURIComponent(query)}&key=${API_KEY}`;

  try {
    const res  = await fetch(url);
    const json = await res.json();
    if (json.status === 'OK' && json.results?.[0]) {
      const loc = json.results[0].geometry.location;
      coords[p.key] = { lat: loc.lat, lng: loc.lng };
      ok++;
    } else if (json.status === 'ZERO_RESULTS') {
      fail++;
      console.warn(`  zero results: ${p.name} — ${query}`);
    } else {
      // OVER_QUERY_LIMIT / REQUEST_DENIED / INVALID_REQUEST — abort cleanly so we keep progress
      console.error(`  API status ${json.status}: ${json.error_message ?? ''}`);
      save();
      process.exit(1);
    }
  } catch (e) {
    fail++;
    console.warn(`  network error for ${p.name}: ${e.message}`);
  }

  if ((i + 1) % SAVE_EVERY === 0) save();
  if ((i + 1) % 25 === 0) {
    console.log(`  progress: ${i + 1}/${todo.length}  (ok=${ok}, fail=${fail})`);
  }
  await sleep(REQUEST_DELAY_MS);
}

save();
console.log(`Done. Geocoded ${ok}, failed ${fail}. Output: ${OUT_PATH}`);
