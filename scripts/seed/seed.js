// Seed bazy Postgres dla DoRecepty.
// Uruchom:  DATABASE_URL=postgresql://user:pass@host:5432/db node seed.js
//
// Skrypt:
//   1. Czyści wszystkie tabele danych (zachowuje porządek FK).
//   2. Tworzy jednego użytkownika (Jan Kowalski) z bcrypt-hashowanym hasłem.
//   3. Wgrywa kilka leków.
//   4. Tworzy recepty — przypisanie do użytkownika wykonuje przez wyszukanie po PESEL.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// --- Dane użytkownika testowego ---
const USER = {
  firstName: 'Jan',
  lastName: 'Kowalski',
  email: 'jan.kowalski@dorecepty.test',
  // Silne hasło: 8+ znaków, mała + wielka litera, cyfra, znak specjalny.
  plainPassword: 'TestHaslo1!',
  // Poprawny formatowo (suma kontrolna OK) PESEL: data urodzenia 1990-01-01.
  pesel: '90010112349',
};

// --- Szablony leków (mała próbka — kompatybilna z medication.name w aplikacji) ---
const MEDICATIONS = [
  { name: 'Concor 10', commonName: 'Bisoprololum', strength: '10 mg', pharmaceuticalForm: 'Tabletki', packageSize: '30 tabl.' },
  { name: 'Apap', commonName: 'Paracetamolum', strength: '500 mg', pharmaceuticalForm: 'Tabletki powlekane', packageSize: '2 tabl.' },
  { name: 'Sortis 20', commonName: 'Atorvastatinum', strength: '20 mg', pharmaceuticalForm: 'Tabletki powlekane', packageSize: '30 tabl.' },
];

// --- Szablony recept (linkowane po PESEL niżej) ---
const PRESCRIPTIONS = [
  {
    accessCode: '2341',
    issueOffset: -5,        // dni względem dziś
    expirationOffset: 25,
    doctorNpwz: '1234567',
    clinicRegon: '123456789',
    status: 'ACTIVE',
    items: [
      { medicationName: 'Concor 10', quantity: 1, dosage: '1 x 1 tabl. rano', status: 'ACTIVE' },
    ],
  },
  {
    accessCode: '8810',
    issueOffset: -120,
    expirationOffset: -90,
    doctorNpwz: '1234567',
    clinicRegon: '123456789',
    status: 'REALIZED',
    items: [
      { medicationName: 'Apap', quantity: 1, dosage: '1 tabl. w razie bólu', status: 'REALIZED' },
    ],
  },
  {
    accessCode: '9977',
    issueOffset: -23,
    expirationOffset: 7,
    doctorNpwz: '1234567',
    clinicRegon: '123456789',
    status: 'ACTIVE',
    items: [
      { medicationName: 'Sortis 20', quantity: 1, dosage: '1 x 1 tabl. wieczorem', status: 'ACTIVE' },
    ],
  },
];

// Zwraca datę względną do "dziś" (offset w dniach), tylko data (bez czasu).
function dateOffset(days) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  // 1. Czyszczenie bazy — kolejność ważna ze względu na FK.
  console.log('[1/4] Czyszczę bazę…');
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tworzenie użytkownika z bcrypt-hashowanym hasłem.
  console.log('[2/4] Tworzę użytkownika…');
  const passwordHash = await bcrypt.hash(USER.plainPassword, 10);
  await prisma.user.create({
    data: {
      firstName: USER.firstName,
      lastName: USER.lastName,
      email: USER.email,
      passwordHash,
      pesel: USER.pesel,
      role: 'PATIENT',
    },
  });

  // 3. Leki — wgrywamy w jednej paczce.
  console.log('[3/4] Wgrywam leki…');
  await prisma.medication.createMany({ data: MEDICATIONS });

  // 4. Recepty — właściciel ustalany przez wyszukanie po PESEL.
  console.log('[4/4] Tworzę recepty (właściciel po PESEL)…');
  const owner = await prisma.user.findUnique({ where: { pesel: USER.pesel } });
  if (!owner) throw new Error(`Nie znaleziono użytkownika o PESEL ${USER.pesel}`);

  for (const [idx, p] of PRESCRIPTIONS.entries()) {
    const recipeNum = idx + 1;
    const prescription = await prisma.prescription.create({
      data: {
        // package_key musi być unikalny — sklejamy z PESEL + numer recepty.
        packageKey: `PKG-${USER.pesel}-${String(recipeNum).padStart(4, '0')}`,
        accessCode: p.accessCode,
        issueDate: dateOffset(p.issueOffset),
        expirationDate: dateOffset(p.expirationOffset),
        patientId: owner.id,           // <-- przypisanie przez ID pobrane po PESEL
        doctorNpwz: p.doctorNpwz,
        clinicRegon: p.clinicRegon,
        status: p.status,
      },
    });

    // Pozycje recepty — łączenie z lekiem po nazwie.
    for (const [posIdx, it] of p.items.entries()) {
      const med = await prisma.medication.findFirst({ where: { name: it.medicationName } });
      if (!med) {
        console.warn(`  ! Lek "${it.medicationName}" nie istnieje — pomijam pozycję`);
        continue;
      }
      await prisma.prescriptionItem.create({
        data: {
          prescriptionId: prescription.id,
          prescriptionOid: `PL.CSIOZ.U${USER.pesel}.R${recipeNum}.I${posIdx + 1}`,
          oidPrefix: 'PL.CSIOZ.2024',
          positionInPackage: posIdx + 1,
          medicationId: med.id,
          quantity: it.quantity,
          dosageInstructions: it.dosage,
          status: it.status,
        },
      });
    }
  }

  console.log('Gotowe ✓');
  console.log(`  Login: ${USER.email}`);
  console.log(`  Hasło: ${USER.plainPassword}`);
  console.log(`  PESEL: ${USER.pesel}`);
}

main()
  .catch((e) => {
    console.error('Seed nie powiódł się:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
