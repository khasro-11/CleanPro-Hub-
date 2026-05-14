import type Anthropic from "@anthropic-ai/sdk";

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "listCustomers",
    description: "Listet Kunden auf. Kann nach Name, Status und Kundentyp filtern.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Suchbegriff (Name, Firma, Stadt, E-Mail)" },
        status: {
          type: "string",
          enum: ["AKTIV", "INAKTIV", "ARCHIVIERT"],
          description: "Kundenstatus filtern",
        },
        customerType: {
          type: "string",
          enum: ["PRIVAT", "BUERO", "INDUSTRIE", "SONDER"],
          description: "Kundentyp filtern",
        },
        limit: { type: "number", description: "Maximale Anzahl Ergebnisse (Standard: 10)" },
      },
    },
  },
  {
    name: "createCustomer",
    description: "Legt einen neuen Kunden an. Nur für Admins.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Vollständiger Name oder Kontaktperson" },
        company: { type: "string", description: "Firmenname (optional)" },
        street: { type: "string", description: "Straße und Hausnummer" },
        zip: { type: "string", description: "Postleitzahl" },
        city: { type: "string", description: "Stadt" },
        phone: { type: "string", description: "Telefonnummer (optional)" },
        email: { type: "string", description: "E-Mail-Adresse (optional)" },
        customerType: {
          type: "string",
          enum: ["PRIVAT", "BUERO", "INDUSTRIE", "SONDER"],
          description: "Kundentyp",
        },
        contractType: {
          type: "string",
          enum: ["EINMALIG", "WOECHENTLICH", "ZWEIMAL_MONATLICH", "MONATLICH"],
          description: "Vertragstyp",
        },
        hourlyRate: { type: "number", description: "Stundensatz in EUR (optional)" },
        flatRate: { type: "number", description: "Pauschale in EUR (optional)" },
        notes: { type: "string", description: "Interne Notizen (optional)" },
      },
      required: ["name", "street", "zip", "city", "customerType", "contractType"],
    },
  },
  {
    name: "updateCustomer",
    description: "Aktualisiert einen bestehenden Kunden. Nur für Admins.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Kunden-ID" },
        name: { type: "string" },
        company: { type: "string" },
        street: { type: "string" },
        zip: { type: "string" },
        city: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        customerType: { type: "string", enum: ["PRIVAT", "BUERO", "INDUSTRIE", "SONDER"] },
        contractType: {
          type: "string",
          enum: ["EINMALIG", "WOECHENTLICH", "ZWEIMAL_MONATLICH", "MONATLICH"],
        },
        hourlyRate: { type: "number" },
        flatRate: { type: "number" },
        status: { type: "string", enum: ["AKTIV", "INAKTIV", "ARCHIVIERT"] },
        notes: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "listEmployees",
    description: "Listet Mitarbeiter auf. Kann nach Name, Status und Vertragstyp filtern.",
    input_schema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Suchbegriff (Name, E-Mail, Stadt)" },
        status: {
          type: "string",
          enum: ["AKTIV", "KRANK", "URLAUB", "INAKTIV"],
          description: "Mitarbeiterstatus filtern",
        },
        contractType: {
          type: "string",
          enum: ["VOLLZEIT", "TEILZEIT", "MINIJOB", "AUSHILFE"],
          description: "Vertragstyp filtern",
        },
        limit: { type: "number", description: "Maximale Anzahl Ergebnisse (Standard: 10)" },
      },
    },
  },
  {
    name: "createEmployee",
    description: "Legt einen neuen Mitarbeiter an. Nur für Admins.",
    input_schema: {
      type: "object",
      properties: {
        firstName: { type: "string", description: "Vorname" },
        lastName: { type: "string", description: "Nachname" },
        email: { type: "string", description: "E-Mail-Adresse (optional)" },
        phone: { type: "string", description: "Telefonnummer (optional)" },
        street: { type: "string", description: "Straße und Hausnummer (optional)" },
        zip: { type: "string", description: "Postleitzahl (optional)" },
        city: { type: "string", description: "Stadt (optional)" },
        contractType: {
          type: "string",
          enum: ["VOLLZEIT", "TEILZEIT", "MINIJOB", "AUSHILFE"],
          description: "Vertragstyp",
        },
        hourlyWage: { type: "number", description: "Stundenlohn in EUR (optional)" },
        weeklyHours: { type: "number", description: "Wochenstunden (optional)" },
        startDate: { type: "string", description: "Einstellungsdatum ISO (optional)" },
      },
      required: ["firstName", "lastName", "contractType"],
    },
  },
  {
    name: "scheduleJob",
    description: "Plant einen neuen Auftrag und weist Mitarbeiter zu. Nur für Admins.",
    input_schema: {
      type: "object",
      properties: {
        customerId: { type: "string", description: "Kunden-ID" },
        employeeIds: {
          type: "array",
          items: { type: "string" },
          description: "Liste der Mitarbeiter-IDs",
        },
        title: { type: "string", description: "Auftragsbezeichnung" },
        scheduledAt: {
          type: "string",
          description: "Datum und Uhrzeit als ISO-String (z. B. 2026-05-20T10:00:00)",
        },
        duration: { type: "number", description: "Dauer in Minuten" },
        recurrence: {
          type: "string",
          enum: ["EINMALIG", "TAEGLICH", "WOECHENTLICH", "ZWEIMAL_MONATLICH", "MONATLICH"],
          description: "Wiederholung (Standard: EINMALIG)",
        },
        description: { type: "string", description: "Beschreibung (optional)" },
        notes: { type: "string", description: "Interne Notizen (optional)" },
      },
      required: ["customerId", "employeeIds", "title", "scheduledAt", "duration"],
    },
  },
  {
    name: "getEmployeeHours",
    description: "Gibt die Gesamtstunden eines Mitarbeiters in einem Zeitraum zurück.",
    input_schema: {
      type: "object",
      properties: {
        employeeId: { type: "string", description: "Mitarbeiter-ID" },
        from: { type: "string", description: "Startdatum als ISO-String (z. B. 2026-05-01)" },
        to: { type: "string", description: "Enddatum als ISO-String (z. B. 2026-05-31)" },
      },
      required: ["employeeId", "from", "to"],
    },
  },
  {
    name: "generateMonthlyReport",
    description: "Generiert einen Monatsbericht mit Aufträgen, Stunden und Umsatz.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "number", description: "Monat (1–12)" },
        year: { type: "number", description: "Jahr (z. B. 2026)" },
      },
      required: ["month", "year"],
    },
  },
  {
    name: "findAvailableEmployee",
    description:
      "Findet Mitarbeiter, die zu einem bestimmten Zeitpunkt für einen Auftrag verfügbar sind.",
    input_schema: {
      type: "object",
      properties: {
        datetime: {
          type: "string",
          description: "Gewünschter Termin als ISO-String (z. B. 2026-05-20T10:00:00)",
        },
        duration: { type: "number", description: "Dauer des Auftrags in Minuten" },
      },
      required: ["datetime", "duration"],
    },
  },
];
