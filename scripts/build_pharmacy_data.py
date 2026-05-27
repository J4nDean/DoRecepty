"""
Buduje plik SQL z danymi aptek dla tabeli PHARMACY.

Wejście:
  - apteki_warszawa_zabki.txt (INSERT-y do tabeli `apteki`)
  - pharmacy_coords.json     (pre-geocoded coords dla większości aptek)

Brakujące współrzędne dogeokodowywane są przez Nominatim (OpenStreetMap),
free / no API key / limit 1 req/sec.

Wyjście:
  - backend/src/main/resources/data/pharmacies.sql

Wymagania: pip install requests
"""

import json
import re
import time
import sys
from pathlib import Path
import requests

ROOT             = Path(__file__).resolve().parent.parent
SOURCE_TXT       = Path(r"C:\Users\jandz\Downloads\apteki_warszawa_zabki.txt")
COORDS_JSON      = ROOT / "backend" / "src" / "main" / "resources" / "pharmacy_coords.json"
OUT_SQL          = ROOT / "backend" / "src" / "main" / "resources" / "data" / "pharmacies.sql"

NOMINATIM_URL    = "https://nominatim.openstreetmap.org/search"
USER_AGENT       = "finder-e-prescription/1.0 (educational project)"
NOMINATIM_DELAY  = 1.1  # sekund — limit Nominatim to 1 req/sec

# Domyślne fallback coords (centrum Warszawy) na wypadek totalnej porażki
WARSZAWA_FALLBACK = (52.2297, 21.0122)
ZABKI_FALLBACK    = (52.2912, 21.1141)
MARKI_FALLBACK    = (52.3286, 21.1058)
ZIELONKA_FALLBACK = (52.3046, 21.1581)


# ── Parsowanie INSERT-ów ─────────────────────────────────────────────────────

# Kolejność kolumn z definicji CREATE TABLE w pliku źródłowym
COLS = [
    "identyfikator_apteki", "nazwa_apteki", "stan_apteki", "rodzaj_apteki",
    "data_uruchomienia_apteki", "zakres_dzialalnosci", "numer_zezwolenia",
    "data_wydania_zezwolenia", "data_cofniecia_zezwolenia", "data_wygaszenia_zezwolenia",
    "data_uprawomocnienia_zezwolenia", "data_uprawomocnienia_cofniecia_wygaszenia",
    "data_nadania_rygoru_wykonywalnosci", "data_termin_waznosci", "organ_wydajacy",
    "rodzaj_zezwolenia", "zmiana_zezwolenia_data_wydania_zmiany",
    "zmiana_zezwolenia_numer_dokumentu", "zmiana_zezwolenia_opis_zmiany",
    "wojewodztwo", "powiat", "gmina", "typ_ulicy", "nazwa_ulicy", "numer_budynku",
    "numer_lokalu", "miejscowosc", "kod_pocztowy", "poczta", "terc", "simc", "ulic",
    "telefon", "fax", "email", "adres_www",
    "data_rozpoczecia_sprzedazy_wysylkowej", "czy_szprzedaz_wysylkowa",
    "adres_www_sprzedazy",
    "kierownik_imie", "kierownik_nazwisko", "kierownik_npwz", "kierownik_iiw",
    "kierownik_data_rozpoczecia",
    "zastepca_kierownika_imie", "zastpeca_kierownika_nazwisko",
    "zastepca_kierownika_npwz", "zastepca_kierownika_data_rozpoczecia",
    "wlasciciel_nazwa", "wlasciciel_nip", "wlasciciel_regon", "wlasciciel_krs",
    "wlasciciel_forma_prawna", "wlasciciel_imie", "wlasciciel_nazwisko",
    "wlasciciel_wojewodztwo", "wlasciciel_powiat", "wlasciciel_gmina",
    "wlasciciel_typ_ulicy", "wlasciciel_nazwa_ulicy", "wlasciciel_numer_budynku",
    "wlasciciel_numer_lokalu", "wlasciciel_miejscowosc", "wlasciciel_kod_pocztowy",
    "wlasciciel_poczta", "wlasciciel_terc", "wlasciciel_simc", "wlasciciel_ulic",
    "godziny_otwarcia_poniedzialek", "godziny_otwarcia_wtorek",
    "godziny_otwarcia_sroda", "godziny_otwarcia_czwartek",
    "godziny_otwarcia_piatek", "godziny_otwarcia_sobota",
    "godziny_otwarcia_niedziela_handlowa", "godziny_otwarcia_niedziela_niehandlowa",
]


def parse_sql_values(values_str: str) -> list[str]:
    """Parsuje listę wartości z 'a', 'b', 'c' uwzględniając escape '' w stringach."""
    out = []
    i = 0
    n = len(values_str)
    while i < n:
        # Pomiń whitespace i przecinek
        while i < n and values_str[i] in " ,\t\n":
            i += 1
        if i >= n:
            break
        if values_str[i] != "'":
            # niespodzianka — szukamy zakończenia tokenu (nie powinno się zdarzyć)
            j = i
            while j < n and values_str[j] not in ",":
                j += 1
            out.append(values_str[i:j].strip())
            i = j
            continue
        # String 'aaa' z możliwym escape '' w środku
        i += 1
        buf = []
        while i < n:
            if values_str[i] == "'" and i + 1 < n and values_str[i + 1] == "'":
                buf.append("'")
                i += 2
            elif values_str[i] == "'":
                i += 1
                break
            else:
                buf.append(values_str[i])
                i += 1
        out.append("".join(buf))
    return out


INSERT_RE = re.compile(r"^INSERT INTO apteki VALUES \((.*)\);\s*$", re.DOTALL)

def parse_pharmacies(source_path: Path) -> list[dict]:
    rows = []
    with source_path.open(encoding="utf-8") as f:
        for line in f:
            m = INSERT_RE.match(line)
            if not m:
                continue
            vals = parse_sql_values(m.group(1))
            if len(vals) != len(COLS):
                # tolerancja: niektóre wiersze mogą się różnić — pomijamy ciche błędy
                print(f"  WARN: row with {len(vals)} cols (expected {len(COLS)})", file=sys.stderr)
                continue
            rec = dict(zip(COLS, vals))
            # Pomijamy nieaktywne apteki — chcemy zachować liczbę 691 → user prosi by liczba aptek się nie zmieniła
            # więc trzymamy też nieaktywne
            rows.append(rec)
    return rows


# ── Klucz pasujący do pharmacy_coords.json ───────────────────────────────────

def coord_key(rec: dict) -> str:
    """Klucz w formacie 'NAZWA|typ_ulicy nazwa_ulicy numer_budynku'."""
    typ = rec["typ_ulicy"].strip()
    nazwa = rec["nazwa_ulicy"].strip()
    nr = rec["numer_budynku"].strip()
    if typ:
        street = f"{typ} {nazwa} {nr}".strip()
    else:
        street = f"{nazwa} {nr}".strip()
    return f"{rec['nazwa_apteki']}|{street}"


def build_address(rec: dict) -> str:
    typ = rec["typ_ulicy"].strip()
    nazwa = rec["nazwa_ulicy"].strip()
    nr = rec["numer_budynku"].strip()
    lok = rec["numer_lokalu"].strip()
    parts = []
    if typ:
        parts.append(typ)
    if nazwa:
        parts.append(nazwa)
    if nr:
        parts.append(nr)
    addr = " ".join(parts)
    if lok:
        addr += f"/{lok}"
    return addr


def first_phone(rec: dict) -> str:
    raw = rec["telefon"].strip()
    if not raw:
        return ""
    # pierwszy token oddzielony ; lub przecinkiem
    first = re.split(r"[;,]", raw)[0].strip()
    return first[:30]


# ── Nominatim geocoding ──────────────────────────────────────────────────────

def geocode_nominatim(addr: str, city: str, postal: str) -> tuple[float, float] | None:
    params = {
        "format": "json",
        "limit": 1,
        "countrycodes": "pl",
        "street": addr,
        "city": city,
        "postalcode": postal,
    }
    try:
        r = requests.get(NOMINATIM_URL, params=params,
                         headers={"User-Agent": USER_AGENT}, timeout=15)
        r.raise_for_status()
        data = r.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
    except requests.RequestException as e:
        print(f"    Nominatim error: {e}", file=sys.stderr)
    return None


def city_fallback(city: str) -> tuple[float, float]:
    c = city.strip().lower()
    if c.startswith("ząbki") or c.startswith("zabki"):
        return ZABKI_FALLBACK
    if c.startswith("marki"):
        return MARKI_FALLBACK
    if c.startswith("zielonka"):
        return ZIELONKA_FALLBACK
    return WARSZAWA_FALLBACK


# ── Generowanie SQL ──────────────────────────────────────────────────────────

def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def main():
    print(f"Wczytuję pre-geocoded coords: {COORDS_JSON}")
    with COORDS_JSON.open(encoding="utf-8") as f:
        coords = json.load(f)
    print(f"  Pre-geocoded: {len(coords)} aptek")

    print(f"Parsuję apteki: {SOURCE_TXT}")
    pharmacies = parse_pharmacies(SOURCE_TXT)
    print(f"  Sparsowano: {len(pharmacies)} aptek")

    matched, geocoded_now, fallback = 0, 0, 0
    enriched = []

    for i, rec in enumerate(pharmacies, 1):
        key = coord_key(rec)
        coord = coords.get(key)
        if coord:
            lat, lon = coord["lat"], coord["lng"]
            matched += 1
        else:
            addr = build_address(rec)
            city = rec["miejscowosc"]
            postal = rec["kod_pocztowy"]
            print(f"  [{i}/{len(pharmacies)}] Geokodowanie: {rec['nazwa_apteki']} — {addr}, {city}")
            res = geocode_nominatim(addr, city, postal)
            time.sleep(NOMINATIM_DELAY)
            if res:
                lat, lon = res
                geocoded_now += 1
                coords[key] = {"lat": lat, "lng": lon}
            else:
                lat, lon = city_fallback(city)
                fallback += 1
                print(f"    -> fallback do centrum miasta: {city}")
        enriched.append({**rec, "lat": lat, "lon": lon})

    print(f"\nPodsumowanie geokodowania:")
    print(f"  Z pre-geocoded JSON: {matched}")
    print(f"  Nowo zgeokodowane:   {geocoded_now}")
    print(f"  Fallback:            {fallback}")
    print(f"  Razem:               {len(enriched)}")

    # zapisz odświeżony JSON
    with COORDS_JSON.open("w", encoding="utf-8") as f:
        json.dump(coords, f, ensure_ascii=False, indent=2)

    # Generuj SQL
    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with OUT_SQL.open("w", encoding="utf-8") as f:
        f.write("-- Apteki publiczne (rejestr aptek) z geokodowaniem.\n")
        f.write("-- Zgodne ze schematem tabeli PHARMACY (id BIGSERIAL).\n")
        f.write("-- Wygenerowano przez scripts/build_pharmacy_data.py\n\n")
        f.write("INSERT INTO pharmacy (name, address, city, postal_code, phone, latitude, longitude) VALUES\n")
        lines = []
        for r in enriched:
            name        = sql_escape(r["nazwa_apteki"][:255])
            address     = sql_escape(build_address(r)[:255])
            city        = sql_escape(r["miejscowosc"][:100])
            postal_code = sql_escape(r["kod_pocztowy"][:10])
            phone       = sql_escape(first_phone(r))
            lat         = r["lat"]
            lon         = r["lon"]
            lines.append(
                f"  ('{name}', '{address}', '{city}', '{postal_code}', "
                f"'{phone}', {lat}, {lon})"
            )
        f.write(",\n".join(lines))
        f.write(";\n")

    print(f"\nZapisano: {OUT_SQL}  ({len(enriched)} rekordów)")


if __name__ == "__main__":
    main()
