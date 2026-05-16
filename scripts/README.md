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
