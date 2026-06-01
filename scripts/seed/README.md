# DoRecepty — seed (Node.js + Prisma) na Railway

Standalone skrypt seedujący Postgres-a hostowanego na Railway.

## Co robi
1. Czyści tabele danych (FK-safe).
2. Tworzy jednego użytkownika: **Jan Kowalski** (`jan.kowalski@dorecepty.test` / `TestHaslo1!`, PESEL `44051401458`), hasło zahashowane bcryptem.
3. Wgrywa kilka leków.
4. Tworzy recepty — właściciel ustalany przez **wyszukanie po PESEL**.

## Uruchomienie na bazie Railway

### Opcja A — lokalnie przez Railway CLI (najprościej)

Wymaga: [Railway CLI](https://docs.railway.app/develop/cli) (`npm i -g @railway/cli`).

```powershell
cd scripts/seed
npm install

railway login
railway link              # wybierz projekt finder-e-prescription
railway run --service Postgres npm run seed
```

`railway run` wstrzyknie `DATABASE_URL` z usługi Postgres do procesu.

### Opcja B — przez publiczny URL Postgresa

W Railway → Postgres → **Variables** skopiuj `DATABASE_PUBLIC_URL` (nie `DATABASE_URL` — ten jest tylko dla wnętrza Railway).

```powershell
cd scripts/seed
npm install
$env:DATABASE_URL = "postgresql://postgres:HASLO@viaduct.proxy.rlwy.net:PORT/railway"
npm run seed
```

### Opcja C — jako jednorazowa komenda na deployu Railway

W Railway możesz dodać osobną usługę "seed" z root dir `scripts/seed`, build command `npm install && npx prisma generate`, start command `node seed.js`. Po wystartowaniu od razu się zakończy. Najprościej jednak puścić to z lokala (Opcja A).

## ⚠️ Uwaga — kolizja z Java DataSeederem

Aplikacja Spring Boot przy każdym starcie czyści tabele `pharmacy`, `medication`, `pharmacy_inventory` i wgrywa swoje seedy. Jeśli chcesz, żeby ten skrypt był jedynym źródłem danych — wyłącz Java seeder (skomentuj `truncateReferenceTables()` + `runSeed(...)` w [DataSeeder.java](../../backend/src/main/java/pl/j4ndean/finderbackend/seeder/DataSeeder.java)) albo uruchamiaj ten skrypt **po** każdym starcie backendu.

Tabele `app_user`, `prescription`, `prescription_item` nie są ruszane przez Springa, więc usera + recepty z tego skryptu zostają nietknięte.
