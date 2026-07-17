export const SPORT_MODALITIES = [
  { id: "football", label: "Futebol" },
  { id: "futsal", label: "Futsal" },
  { id: "society", label: "Society" },
  { id: "basketball", label: "Basquete" },
  { id: "volleyball", label: "Vôlei" },
  { id: "beach_tennis", label: "Beach Tennis" },
  { id: "tennis", label: "Tênis" },
  { id: "paddle", label: "Padel" },
  { id: "handball", label: "Handebol" },
  { id: "other", label: "Outro" },
] as const;

export type SportModalityId = (typeof SPORT_MODALITIES)[number]["id"];

export function sportLabel(id: string): string {
  return SPORT_MODALITIES.find((s) => s.id === id)?.label ?? id;
}

export const WEEKDAYS = [
  { dayOfWeek: 0, label: "Dom" },
  { dayOfWeek: 1, label: "Seg" },
  { dayOfWeek: 2, label: "Ter" },
  { dayOfWeek: 3, label: "Qua" },
  { dayOfWeek: 4, label: "Qui" },
  { dayOfWeek: 5, label: "Sex" },
  { dayOfWeek: 6, label: "Sáb" },
] as const;
