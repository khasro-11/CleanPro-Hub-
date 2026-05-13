import { CustomerType, ContractType, CustomerStatus, JobStatus, EmployeeStatus, EmployeeContractType, RecurrenceType } from "@prisma/client";

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  PRIVAT: "Privat",
  BUERO: "Büro",
  INDUSTRIE: "Industrie",
  SONDER: "Sonderreinigung",
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  EINMALIG: "Einmalig",
  WOECHENTLICH: "Wöchentlich",
  ZWEIMAL_MONATLICH: "2× monatlich",
  MONATLICH: "Monatlich",
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  AKTIV: "Aktiv",
  INAKTIV: "Inaktiv",
  ARCHIVIERT: "Archiviert",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  GEPLANT: "Geplant",
  IN_BEARBEITUNG: "In Bearbeitung",
  ABGESCHLOSSEN: "Abgeschlossen",
  ABGESAGT: "Abgesagt",
};

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  AKTIV: "Aktiv",
  KRANK: "Krank",
  URLAUB: "Urlaub",
  INAKTIV: "Inaktiv",
};

export const EMPLOYEE_CONTRACT_TYPE_LABELS: Record<EmployeeContractType, string> = {
  VOLLZEIT: "Vollzeit",
  TEILZEIT: "Teilzeit",
  MINIJOB: "Minijob",
  AUSHILFE: "Aushilfe",
};

export const RECURRENCE_TYPE_LABELS: Record<RecurrenceType, string> = {
  EINMALIG: "Einmalig",
  TAEGLICH: "Täglich",
  WOECHENTLICH: "Wöchentlich",
  ZWEIMAL_MONATLICH: "2× monatlich",
  MONATLICH: "Monatlich",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  GEPLANT: "bg-sky-100 text-sky-700 border-sky-200",
  IN_BEARBEITUNG: "bg-amber-100 text-amber-700 border-amber-200",
  ABGESCHLOSSEN: "bg-emerald-100 text-emerald-700 border-emerald-200",
  ABGESAGT: "bg-red-100 text-red-700 border-red-200",
};
