const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getTime());
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const monthStart = (value: Date): Date => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
const monthEnd = (value: Date): Date => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0));

export function monthKey(value: string | Date): string {
  const date = toDate(value);
  if (!date) {
    throw new Error("Invalid date");
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function clampToMonthStartEnd(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): { start: Date; end: Date } {
  const startDate = toDate(start) ?? toDate(end);
  const endDate = toDate(end) ?? toDate(start);
  const safeStart = startDate ? monthStart(startDate) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const safeEnd = endDate ? monthEnd(endDate) : monthEnd(safeStart);
  if (safeStart.getTime() > safeEnd.getTime()) {
    return { start: safeEnd, end: safeStart };
  }
  return { start: safeStart, end: safeEnd };
}

export function monthRangeInclusive(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string[] {
  const { start: startDate, end: endDate } = clampToMonthStartEnd(start, end);
  const months: string[] = [];
  let cursor = new Date(startDate.getTime());
  while (cursor.getTime() <= endDate.getTime()) {
    months.push(monthKey(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return months;
}
