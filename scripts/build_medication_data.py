"""
Buduje plik SQL ze 100 popularnymi, różnorodnymi lekami z RPL.

Wejście:
  Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_*.xml

Selekcja:
  - lista znanych popularnych leków/marek (Apap, Polopiryna, Augmentin, ...)
  - dla każdej marki bierzemy 1 produkt + 1 opakowanie (najmniejsze)
  - dopełniamy różnorodnością ATC (różne pierwsze 3 znaki kodu) do 100 sztuk
  - preferujemy OTC, potem Rp

Wyjście:
  backend/src/main/resources/data/medications.sql
"""

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT       = Path(__file__).resolve().parent.parent
SOURCE_XML = Path(r"C:\Users\jandz\Downloads\Rejestr_Produktow_Leczniczych_calosciowy_stan_na_dzien_20260526_6.0.0.xml")
OUT_SQL    = ROOT / "backend" / "src" / "main" / "resources" / "data" / "medications.sql"

NS = "{http://rejestry.ezdrowie.gov.pl/rpl/eksport-danych-v6.0.0}"

TARGET_COUNT = 100

# Kuratorka — popularne, dobrze znane preparaty w Polsce.
# Klucz = wzorzec (case-insensitive, substring nazwaProduktu), wartość = priorytet.
# Im wyższy priorytet, tym pewniej zostanie wybrany.
POPULAR_PATTERNS = [
    # Przeciwbólowe / przeciwgorączkowe
    "Apap", "Paracetamol", "Panadol", "Codipar",
    "Polopiryna", "Aspirin", "Polocard", "Acard",
    "Ibuprom", "Nurofen", "Ibuprofen", "MIG",
    "Pyralgina", "Pyralginum",
    "Ketonal", "Ketoprofen",
    "Voltaren", "Olfen", "Dicloberl", "Diclofenac",
    "Naproxen", "Aleve",
    "Tramal", "Poltram",
    "Metamizol",
    # Przeciw przeziębieniu / antygrypowe
    "Theraflu", "Gripex", "Coldrex", "Fervex", "Rubital",
    "Acatar", "Sudafed",
    "Rutinoscorbin", "Rutinacea", "Cebion", "Vitamin C",
    "Strepsils", "Septolete", "Cholinex", "Orofar",
    # Kaszel / drogi oddechowe
    "Mucosolvan", "Flegamina", "Ambroxol",
    "ACC", "Fluimucil",
    "Tussipect", "Acodin",
    "Sirupus", "Bromhexin",
    "Pulmicort", "Berodual", "Salbutamol", "Ventolin",
    "Foradil", "Symbicort",
    # Alergia
    "Claritine", "Loratadyna",
    "Zyrtec", "Allertec", "Cetirizine",
    "Telfast", "Aerius",
    "Xyzal",
    # Żołądek / przewód pokarmowy
    "Polprazol", "Helicid", "Bioprazol", "Omeprazol",
    "Controloc", "Pantoprazol",
    "Famotydyna", "Famotidin",
    "Ranigast",
    "Smecta",
    "Imodium", "Stoperan", "Laremid",
    "Espumisan", "Simetikon",
    "No-Spa", "Drotaweryna",
    "Tasectan",
    "Lakcid", "Trilac", "Enterol",
    "Hepatil", "Sylimarol",
    # Serce i nadciśnienie
    "Concor", "Bisocard", "Bisoprolol",
    "Atenolol",
    "Metocard", "Metoprolol",
    "Tritace", "Ramipril",
    "Enarenal", "Enalapril",
    "Lisinopril",
    "Amlozek", "Amlodypina", "Norvasc",
    "Lacipil",
    "Tertensif", "Indapamid",
    "Sortis", "Atoris", "Atorvastatyna",
    "Zocor", "Simvastatyna",
    "Crestor", "Rosuvastatyna",
    "Polfilin", "Pentoxifyllin",
    # Cukrzyca
    "Metformax", "Metformin", "Glucophage",
    "Diaprel", "Gliclazide",
    "Glibenese",
    # Tarczyca / hormony
    "Eutyrox", "Letrox", "Euthyrox",
    "Metizol",
    # Antybiotyki
    "Augmentin", "Amoksiklav", "Amotaks", "Amoxicillin",
    "Duomox",
    "Cipronex", "Ciprofloxacin", "Ciprinol",
    "Klacid", "Klabion", "Clarithromycin",
    "Sumamed", "Azimycin", "Azithromycin",
    "Doxycyclin",
    "Heviran", "Aciclovir",
    "Biseptol",
    "Furagina", "Furazidin",
    # Witaminy / minerały
    "Magne B6", "Magnez",
    "Calcium",
    "Vitaminum",
    "Bilobil",
    "Memotropil",
    "D3",
    "Multi-Sanostol",
    "Centrum",
    # Hormony seksualne / antykoncepcja
    "Diane",
    "Yasmin",
    # Inne popularne
    "Aspirin C",
    "Ascalcin",
    "Ketrel",
    "Hydroxyzinum", "Atarax",
    "Estazolam",
    "Xanax", "Alprazolam",
    "Relanium", "Diazepam",
    "Egzogen",
    "Mydocalm", "Tolperisone",
    "Detralex", "Diosmina",
    "Furosemid",
    "Spironol", "Spironolactone",
    "Polfenon",
]


def text_or_empty(s: str | None) -> str:
    return (s or "").strip()


def package_size(opk_root: ET.Element) -> str:
    """Buduje opis 'liczba opakowań × pojemność jednostka' z pierwszego dziecka."""
    jo = opk_root.find(f"{NS}jednostkiOpakowania/{NS}jednostkaOpakowania")
    if jo is None:
        return ""
    liczba = text_or_empty(jo.get("liczbaOpakowan"))
    rodzaj = text_or_empty(jo.get("rodzajOpakowania"))
    poj    = text_or_empty(jo.get("pojemnosc"))
    jedn   = text_or_empty(jo.get("jednostkaPojemnosci"))
    parts = []
    if liczba:
        parts.append(f"{liczba} {rodzaj}".strip())
    if poj:
        parts.append(f"{poj} {jedn}".strip())
    return " × ".join(parts) if parts else rodzaj


def category_score(kat: str) -> int:
    """OTC najwyżej, potem Rp, potem reszta — żeby preferować dostępne dla każdego."""
    return {"OTC": 0, "Rp": 1, "Rpz": 2, "Rpw": 3, "Lz": 4}.get(kat, 5)


def pick_package(prod: ET.Element) -> ET.Element | None:
    """Bierzemy najmniejsze opakowanie nie-skasowane, preferując OTC."""
    pkgs = []
    for o in prod.findall(f"{NS}opakowania/{NS}opakowanie"):
        if o.get("skasowane") == "TAK":
            continue
        gtin = text_or_empty(o.get("kodGTIN"))
        if not gtin:
            continue
        # rozmiar = liczbaOpakowan × pojemnosc (do sortu — preferujemy mniejsze)
        jo = o.find(f"{NS}jednostkiOpakowania/{NS}jednostkaOpakowania")
        try:
            lop = int(jo.get("liczbaOpakowan") or "1") if jo is not None else 1
        except ValueError:
            lop = 99
        try:
            poj = float(jo.get("pojemnosc") or "1") if jo is not None else 1
        except ValueError:
            poj = 99.0
        score = (category_score(o.get("kategoriaDostepnosci") or ""), lop, poj)
        pkgs.append((score, o))
    if not pkgs:
        return None
    pkgs.sort(key=lambda x: x[0])
    return pkgs[0][1]


def matches_popular(name: str) -> tuple[int, str] | None:
    """Zwraca (priorytet, dopasowany_wzorzec) jeśli pasuje do listy popularnych."""
    nl = name.lower()
    for idx, pat in enumerate(POPULAR_PATTERNS):
        # dopasowanie słowne — pattern musi być prefiksem lub samodzielnym słowem
        if re.search(rf"\b{re.escape(pat.lower())}\b", nl):
            # priorytet = niski numer = wyżej (czołówka listy = bardziej znane)
            return (idx, pat)
    return None


def main():
    print(f"Parsowanie XML: {SOURCE_XML}")
    if not SOURCE_XML.exists():
        print(f"BŁĄD: nie znaleziono {SOURCE_XML}", file=sys.stderr)
        sys.exit(1)

    # iterparse — duży plik, parsujemy strumieniowo
    candidates_popular: list[tuple] = []  # (priorytet, gtin, dict)
    candidates_diverse: dict[str, dict] = {}  # atc_prefix -> record (dla dywersyfikacji)

    count = 0
    for event, elem in ET.iterparse(str(SOURCE_XML), events=("end",)):
        if elem.tag != f"{NS}produktLeczniczy":
            continue
        count += 1

        name = text_or_empty(elem.get("nazwaProduktu"))
        if not name:
            elem.clear()
            continue

        # ATC
        atc_el = elem.find(f"{NS}kodyATC/{NS}kodATC")
        atc = text_or_empty(atc_el.text if atc_el is not None else "")

        pkg = pick_package(elem)
        if pkg is None:
            elem.clear()
            continue

        record = {
            "gtin":                  text_or_empty(pkg.get("kodGTIN")),
            "name":                  name,
            "common_name":           text_or_empty(elem.get("nazwaPowszechnieStosowana")),
            "strength":              text_or_empty(elem.get("moc")),
            "pharmaceutical_form":   text_or_empty(elem.get("nazwaPostaciFarmaceutycznej")),
            "package_size":          package_size(pkg),
            "atc_code":              atc,
            "prescription_category": text_or_empty(pkg.get("kategoriaDostepnosci")),
        }

        match = matches_popular(name)
        if match is not None:
            candidates_popular.append((match[0], match[1], record))
        else:
            # do puli różnorodnościowej jeśli mamy ATC i nie ma jeszcze tej kategorii
            atc_prefix = atc[:3] if atc else ""
            if atc_prefix and atc_prefix not in candidates_diverse:
                # preferujemy OTC i Rp
                if record["prescription_category"] in ("OTC", "Rp"):
                    candidates_diverse[atc_prefix] = record

        elem.clear()

    print(f"  Przetworzono produktów: {count}")
    print(f"  Trafienia popularnych:  {len(candidates_popular)}")
    print(f"  Pula różnorodnościowa:  {len(candidates_diverse)} (po ATC prefix)")

    # Wybór — bierzemy jedno dopasowanie per wzorzec (np. Apap może pasować wiele razy)
    chosen = []
    seen_patterns = set()
    seen_names = set()
    seen_gtins = set()

    candidates_popular.sort(key=lambda t: t[0])
    for prio, pat, rec in candidates_popular:
        if pat in seen_patterns:
            continue
        # unikamy duplikatu po nazwie produktu (różne moc/opakowania)
        name_key = rec["name"].lower()
        if name_key in seen_names:
            continue
        if rec["gtin"] in seen_gtins:
            continue
        chosen.append(rec)
        seen_patterns.add(pat)
        seen_names.add(name_key)
        seen_gtins.add(rec["gtin"])
        if len(chosen) >= TARGET_COUNT:
            break

    # Dopełniamy różnorodnością ATC do 100
    if len(chosen) < TARGET_COUNT:
        for atc_prefix, rec in sorted(candidates_diverse.items()):
            if rec["gtin"] in seen_gtins:
                continue
            if rec["name"].lower() in seen_names:
                continue
            chosen.append(rec)
            seen_names.add(rec["name"].lower())
            seen_gtins.add(rec["gtin"])
            if len(chosen) >= TARGET_COUNT:
                break

    print(f"  Wybrano leków: {len(chosen)}")

    # Zapis SQL
    def esc(s: str) -> str:
        return s.replace("'", "''")

    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with OUT_SQL.open("w", encoding="utf-8") as f:
        f.write("-- 100 popularnych, różnorodnych leków z Rejestru Produktów Leczniczych.\n")
        f.write("-- Zgodne ze schematem tabeli MEDICATION (id BIGSERIAL).\n")
        f.write("-- Wygenerowano przez scripts/build_medication_data.py\n\n")
        f.write("INSERT INTO medication (gtin, name, common_name, strength, "
                "pharmaceutical_form, package_size, atc_code, prescription_category) VALUES\n")
        lines = []
        for r in chosen:
            lines.append(
                "  ("
                f"'{esc(r['gtin'])[:14]}', "
                f"'{esc(r['name'])[:255]}', "
                f"'{esc(r['common_name'])[:255]}', "
                f"'{esc(r['strength'])[:100]}', "
                f"'{esc(r['pharmaceutical_form'])[:150]}', "
                f"'{esc(r['package_size'])[:100]}', "
                f"'{esc(r['atc_code'])[:10]}', "
                f"'{esc(r['prescription_category'])[:10]}'"
                ")"
            )
        f.write(",\n".join(lines))
        f.write(";\n")

    print(f"\nZapisano: {OUT_SQL}  ({len(chosen)} leków)")

    # Krótki raport zawartości
    by_cat: dict[str, int] = {}
    by_atc: dict[str, int] = {}
    for r in chosen:
        by_cat[r["prescription_category"]] = by_cat.get(r["prescription_category"], 0) + 1
        atc = r["atc_code"][:1] if r["atc_code"] else "?"
        by_atc[atc] = by_atc.get(atc, 0) + 1
    print("\nKategorie dostępności:")
    for k, v in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")
    print("\nGłówne grupy ATC (1. litera):")
    for k, v in sorted(by_atc.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
