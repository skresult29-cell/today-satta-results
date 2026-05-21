import { format } from "date-fns";

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "dd MMM yyyy");
}

export function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "dd MMM");
}

export function getWhatsAppLink(phoneNumber: string, message?: string): string {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, "");
  const encodedMessage = message
    ? `?text=${encodeURIComponent(message)}`
    : "";
  return `https://wa.me/${cleanNumber}${encodedMessage}`;
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1).toLocaleString("en", { month: "long" });
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const DEFAULT_GAMES = [
  { gameCode: "desawar", gameName: "DESAWAR", resultTime: "05:00 AM", displayOrder: 1, isActive: true },
  { gameCode: "faridabad", gameName: "FARIDABAD", resultTime: "06:00 PM", displayOrder: 2, isActive: true },
  { gameCode: "ghaziabad", gameName: "GHAZIABAD", resultTime: "09:25 PM", displayOrder: 3, isActive: true },
  { gameCode: "gali", gameName: "GALI", resultTime: "11:25 PM", displayOrder: 4, isActive: true },
];
