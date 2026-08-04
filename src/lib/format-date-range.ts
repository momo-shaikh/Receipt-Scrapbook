import { format, parseISO } from "date-fns";

export function safeFormatDate(date: string, pattern: string): string | undefined {
  try {
    return format(parseISO(date), pattern);
  } catch {
    return undefined;
  }
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (startDate && endDate) {
    const start = safeFormatDate(startDate, "MMM d");
    const end = safeFormatDate(endDate, "MMM d, yyyy");
    if (start && end) return `${start} – ${end}`;
    return end ?? start ?? "";
  }
  const solo = startDate ?? endDate;
  return solo ? (safeFormatDate(solo, "MMM d, yyyy") ?? "") : "";
}

export function formatTripSubtitle(trip: {
  destination: string;
  startDate: string;
  endDate: string;
}): string {
  const dateRange = formatDateRange(trip.startDate, trip.endDate);
  if (trip.destination && dateRange) return `${trip.destination} · ${dateRange}`;
  return trip.destination || dateRange;
}