import { PrismaClient, Role, CustomerType, ContractType, CustomerStatus, EmployeeContractType, EmployeeStatus, JobStatus, RecurrenceType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Users / Auth ─────────────────────────────────────────────────────────
  const adminPassword = await hash("admin1234", 12);
  const mitarbeiterPassword = await hash("mitarbeiter1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@cleanpro.de" },
    update: {},
    create: {
      email: "admin@cleanpro.de",
      password: adminPassword,
      name: "Admin CleanPro",
      role: Role.ADMIN,
    },
  });

  const userAnna = await prisma.user.upsert({
    where: { email: "anna.mueller@cleanpro.de" },
    update: {},
    create: {
      email: "anna.mueller@cleanpro.de",
      password: mitarbeiterPassword,
      name: "Anna Müller",
      role: Role.MITARBEITER,
    },
  });

  const userTom = await prisma.user.upsert({
    where: { email: "tom.schneider@cleanpro.de" },
    update: {},
    create: {
      email: "tom.schneider@cleanpro.de",
      password: mitarbeiterPassword,
      name: "Tom Schneider",
      role: Role.MITARBEITER,
    },
  });

  // ── Employees ─────────────────────────────────────────────────────────────
  const emp1 = await prisma.employee.upsert({
    where: { userId: userAnna.id },
    update: {},
    create: {
      userId: userAnna.id,
      firstName: "Anna",
      lastName: "Müller",
      phone: "+49 170 1234567",
      email: "anna.mueller@cleanpro.de",
      street: "Musterstraße 12",
      zip: "60311",
      city: "Frankfurt",
      birthDate: new Date("1990-05-15"),
      startDate: new Date("2020-01-01"),
      hourlyWage: 15.5,
      contractType: EmployeeContractType.VOLLZEIT,
      status: EmployeeStatus.AKTIV,
      weeklyHours: 40,
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { userId: userTom.id },
    update: {},
    create: {
      userId: userTom.id,
      firstName: "Tom",
      lastName: "Schneider",
      phone: "+49 171 9876543",
      email: "tom.schneider@cleanpro.de",
      street: "Hauptstraße 45",
      zip: "60313",
      city: "Frankfurt",
      birthDate: new Date("1988-11-22"),
      startDate: new Date("2021-03-15"),
      hourlyWage: 14.0,
      contractType: EmployeeContractType.TEILZEIT,
      status: EmployeeStatus.AKTIV,
      weeklyHours: 25,
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      firstName: "Maria",
      lastName: "Gonzalez",
      phone: "+49 172 5551234",
      email: "maria.gonzalez@cleanpro.de",
      street: "Goethestraße 8",
      zip: "60316",
      city: "Frankfurt",
      birthDate: new Date("1995-03-08"),
      startDate: new Date("2023-06-01"),
      hourlyWage: 13.5,
      contractType: EmployeeContractType.MINIJOB,
      status: EmployeeStatus.AKTIV,
      weeklyHours: 15,
    },
  });

  // ── Customers ─────────────────────────────────────────────────────────────
  const customer1 = await prisma.customer.create({
    data: {
      name: "Hans Mustermann",
      street: "Friedensstraße 3",
      zip: "60311",
      city: "Frankfurt",
      phone: "+49 69 1234567",
      email: "hans.mustermann@example.de",
      customerType: CustomerType.PRIVAT,
      contractType: ContractType.WOECHENTLICH,
      hourlyRate: 28.0,
      notes: "Schlüssel hinterlegt. Katze beachten.",
      status: CustomerStatus.AKTIV,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: "Sabine Weber",
      company: "Weber & Partner GmbH",
      street: "Kaiserstraße 55",
      zip: "60329",
      city: "Frankfurt",
      phone: "+49 69 7654321",
      email: "s.weber@weber-partner.de",
      customerType: CustomerType.BUERO,
      contractType: ContractType.ZWEIMAL_MONATLICH,
      flatRate: 350.0,
      notes: "2. und 4. Montag im Monat. Zugang über Pforte.",
      status: CustomerStatus.AKTIV,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: "Techpark Logistik",
      company: "Techpark Logistik AG",
      street: "Industriestraße 200",
      zip: "60386",
      city: "Frankfurt",
      phone: "+49 69 5550000",
      email: "facility@techpark.de",
      customerType: CustomerType.INDUSTRIE,
      contractType: ContractType.WOECHENTLICH,
      flatRate: 1200.0,
      notes: "Sicherheitsausweis erforderlich. Freitags 18–22 Uhr.",
      status: CustomerStatus.AKTIV,
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: "Claudia Braun",
      street: "Römerberg 10",
      zip: "60311",
      city: "Frankfurt",
      phone: "+49 171 3339876",
      customerType: CustomerType.PRIVAT,
      contractType: ContractType.MONATLICH,
      hourlyRate: 26.0,
      status: CustomerStatus.AKTIV,
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: "Stadtpraxis Dr. Klein",
      company: "Arztpraxis Dr. Klein",
      street: "Zeil 70",
      zip: "60313",
      city: "Frankfurt",
      phone: "+49 69 4441111",
      email: "info@praxis-klein.de",
      customerType: CustomerType.BUERO,
      contractType: ContractType.WOECHENTLICH,
      flatRate: 450.0,
      notes: "Hygieneschein der Mitarbeiter erforderlich.",
      status: CustomerStatus.AKTIV,
    },
  });

  // ── Jobs ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  nextMonday.setHours(8, 0, 0, 0);

  const job1 = await prisma.job.create({
    data: {
      customerId: customer1.id,
      title: "Wöchentliche Hausreinigung",
      scheduledAt: nextMonday,
      duration: 120,
      recurrence: RecurrenceType.WOECHENTLICH,
      status: JobStatus.GEPLANT,
    },
  });

  await prisma.jobAssignment.create({
    data: { jobId: job1.id, employeeId: emp1.id },
  });

  const nextTuesday = new Date(nextMonday);
  nextTuesday.setDate(nextMonday.getDate() + 1);
  nextTuesday.setHours(9, 0, 0, 0);

  const job2 = await prisma.job.create({
    data: {
      customerId: customer2.id,
      title: "Büroreinigung Weber & Partner",
      scheduledAt: nextTuesday,
      duration: 180,
      recurrence: RecurrenceType.ZWEIMAL_MONATLICH,
      status: JobStatus.GEPLANT,
    },
  });

  await prisma.jobAssignment.createMany({
    data: [
      { jobId: job2.id, employeeId: emp1.id },
      { jobId: job2.id, employeeId: emp2.id },
    ],
  });

  const nextFriday = new Date(nextMonday);
  nextFriday.setDate(nextMonday.getDate() + 4);
  nextFriday.setHours(18, 0, 0, 0);

  const job3 = await prisma.job.create({
    data: {
      customerId: customer3.id,
      title: "Industriereinigung Techpark",
      scheduledAt: nextFriday,
      duration: 240,
      recurrence: RecurrenceType.WOECHENTLICH,
      status: JobStatus.GEPLANT,
    },
  });

  await prisma.jobAssignment.createMany({
    data: [
      { jobId: job3.id, employeeId: emp2.id },
      { jobId: job3.id, employeeId: emp3.id },
    ],
  });

  const pastDate = new Date(now);
  pastDate.setDate(now.getDate() - 7);
  pastDate.setHours(10, 0, 0, 0);

  const job4 = await prisma.job.create({
    data: {
      customerId: customer4.id,
      title: "Monatliche Reinigung Braun",
      scheduledAt: pastDate,
      duration: 90,
      recurrence: RecurrenceType.MONATLICH,
      status: JobStatus.ABGESCHLOSSEN,
    },
  });

  await prisma.jobAssignment.create({
    data: { jobId: job4.id, employeeId: emp3.id },
  });

  // Simulate a time entry for the completed job
  await prisma.timeEntry.create({
    data: {
      employeeId: emp3.id,
      jobId: job4.id,
      checkIn: pastDate,
      checkOut: new Date(pastDate.getTime() + 90 * 60 * 1000),
      durationMin: 90,
    },
  });

  const nextWed = new Date(nextMonday);
  nextWed.setDate(nextMonday.getDate() + 2);
  nextWed.setHours(14, 0, 0, 0);

  await prisma.job.create({
    data: {
      customerId: customer5.id,
      title: "Praxisreinigung Dr. Klein",
      scheduledAt: nextWed,
      duration: 150,
      recurrence: RecurrenceType.WOECHENTLICH,
      status: JobStatus.GEPLANT,
      assignments: {
        create: [{ employeeId: emp1.id }, { employeeId: emp2.id }],
      },
    },
  });

  // 5 more varied jobs
  for (let i = 0; i < 5; i++) {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    d.setHours(10, 0, 0, 0);
    await prisma.job.create({
      data: {
        customerId: [customer1, customer2, customer3, customer4, customer5][i].id,
        title: `Zusatzauftrag ${i + 1}`,
        scheduledAt: d,
        duration: 60,
        status: JobStatus.GEPLANT,
      },
    });
  }

  // ── Audit log ──────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "seed.create",
      entityType: "System",
      entityId: "seed",
      after: { note: "Initial seed data created" },
    },
  });

  console.info("✅ Seed-Daten erfolgreich angelegt.");
  console.info("  Admin:       admin@cleanpro.de / admin1234");
  console.info("  Mitarbeiter: anna.mueller@cleanpro.de / mitarbeiter1234");
  console.info("  Mitarbeiter: tom.schneider@cleanpro.de / mitarbeiter1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
