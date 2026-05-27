# Scripts

## `geocode-pharmacies.mjs`

One-off (rerunnable) script that geocodes every public pharmacy (`APTEKA OGÓLNODOSTĘPNA` and `PUNKT APTECZNY`) from `apteki_warszawa_zabki.sql` and writes the results to `backend/src/main/resources/pharmacy_coords.json`. The backend loads this file at startup and inserts coordinates straight into the `pharmacy` table — users get pinned pharmacies on first paint, no client-side geocoding needed.

### Run

```bash
GOOGLE_MAPS_API_KEY=AIza... node scripts/geocode-pharmacies.mjs
```

Requires Node 18+ (uses global `fetch`).

### Notes

- **Resumable.** Re-running skips entries already in the JSON, so you can ctrl-C and continue.
- **Rate-limited** to ~5 requests/sec (well under Google's free quota).
- For 691 pharmacies expect ~3 minutes and a few cents of Geocoding API usage on a fresh run.
- Hospital pharmacies and other non-public types are filtered out — matches `PharmacyImportService.migrateFromApteki`.

### When to rerun

- After updating `apteki_warszawa_zabki.sql` with new entries.
- If `pharmacy_coords.json` gets out of sync (e.g. you wiped it).

After running, commit the updated `pharmacy_coords.json` and push — Railway redeploys and the next import will use the new coords.

---

## `build_pharmacy_data.py`

Generates `backend/src/main/resources/data/pharmacies.sql` — ready-to-load `INSERT` statements for the `pharmacy` table.

Uses `pharmacy_coords.json` for pre-geocoded coordinates; falls back to Nominatim (OpenStreetMap) for any missing entries.

```bash
pip install requests
python scripts/build_pharmacy_data.py
```

Input: `apteki_warszawa_zabki.txt` (registry dump) + `pharmacy_coords.json`.
Output: `backend/src/main/resources/data/pharmacies.sql` (691 records).

---

## `build_medication_data.py`

Generates `backend/src/main/resources/data/medications.sql` — 100 popular, diverse medications for the `medication` table.

Parses the full RPL XML, selects well-known brands by name pattern, then fills up to 100 entries by ATC diversity.

```bash
python scripts/build_medication_data.py
```

Input: `Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_*.xml` (from ezdrowie.gov.pl).
Output: `backend/src/main/resources/data/medications.sql` (100 records).
