#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SQL_PATH  = join(REPO_ROOT, 'backend/src/main/resources/apteki_warszawa_zabki.sql');
const OUT_PATH  = join(REPO_ROOT, 'backend/src/main/resources/pharmacy_coords.json');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY env var.');
  process.exit(1);
}

const REQUEST_DELAY_MS = 200;
const SAVE_EVERY       = 10;
const PROGRESS_EVERY   = 25;

const COL = {
  name:     1,
  status:   2,
  kind:     3,
  streetTyp: 22,
  street:    23,
  building:  24,
  city:      26,
};

const PUBLIC_TYPES = new Set(['APTEKA OGÓLNODOSTĘPNA', 'PUNKT APTECZNY']);
const INSERT_RE    = /^INSERT INTO apteki VALUES \((.*)\);\s*$/;
const VALUE_RE     = /'((?:[^']|'')*)'/g;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const trim  = v => (v ?? '').trim();

function parseValues(line) {
  const match = line.match(INSERT_RE);
  if (!match) return null;
  const values = [];
  let m;
  while ((m = VALUE_RE.exec(match[1])) !== null) {
    values.push(m[1].replace(/''/g, "'"));
  }
  return values;
}

function toEntry(values) {
  const name    = trim(values[COL.name]);
  const street  = `${trim(values[COL.streetTyp])} ${trim(values[COL.street])}`.trim();
  const address = `${street} ${trim(values[COL.building])}`.trim();
  const city    = trim(values[COL.city]);
  return { key: `${name}|${address}`, name, address, city };
}

function parsePharmacies(sql) {
  return sql.split('\n')
    .filter(line => line.startsWith('INSERT INTO apteki'))
    .map(parseValues)
    .filter(values =>
      values
      && values[COL.status] === 'AKTYWNA'
      && PUBLIC_TYPES.has(values[COL.kind])
    )
    .map(toEntry)
    .filter(p => p.name && p.address && p.city);
}

function loadCoords() {
  if (!existsSync(OUT_PATH)) return {};
  try {
    return JSON.parse(readFileSync(OUT_PATH, 'utf8'));
  } catch {
    console.warn('Existing pharmacy_coords.json is malformed — starting fresh.');
    return {};
  }
}

async function geocode(pharmacy) {
  const query = `${pharmacy.address}, ${pharmacy.city}, Poland`;
  const url   = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res   = await fetch(url);
  return { query, body: await res.json() };
}

const pharmacies = parsePharmacies(readFileSync(SQL_PATH, 'utf8'));
console.log(`Parsed ${pharmacies.length} public pharmacies from SQL.`);

const coords = loadCoords();
if (Object.keys(coords).length) {
  console.log(`Loaded ${Object.keys(coords).length} existing coordinates — skipping those.`);
}

const todo = pharmacies.filter(p => !coords[p.key]);
console.log(`${todo.length} pharmacies need geocoding.`);

const save = () => writeFileSync(OUT_PATH, JSON.stringify(coords, null, 2) + '\n', 'utf8');

let ok = 0, fail = 0;

for (let i = 0; i < todo.length; i++) {
  const pharmacy = todo[i];

  try {
    const { query, body } = await geocode(pharmacy);
    if (body.status === 'OK' && body.results?.[0]) {
      const { lat, lng } = body.results[0].geometry.location;
      coords[pharmacy.key] = { lat, lng };
      ok++;
    } else if (body.status === 'ZERO_RESULTS') {
      fail++;
      console.warn(`  zero results: ${pharmacy.name} — ${query}`);
    } else {
      console.error(`  API status ${body.status}: ${body.error_message ?? ''}`);
      save();
      process.exit(1);
    }
  } catch (err) {
    fail++;
    console.warn(`  network error for ${pharmacy.name}: ${err.message}`);
  }

  const done = i + 1;
  if (done % SAVE_EVERY === 0) save();
  if (done % PROGRESS_EVERY === 0) {
    console.log(`  progress: ${done}/${todo.length}  (ok=${ok}, fail=${fail})`);
  }
  await sleep(REQUEST_DELAY_MS);
}

save();
console.log(`Done. Geocoded ${ok}, failed ${fail}. Output: ${OUT_PATH}`);
