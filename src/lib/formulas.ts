/** Налог за месяц: 10% от выручки, но не меньше 45 BYN (порог — выручка <= 450). */
export function monthlyTax(revenue: number): number {
  if (revenue <= 450) return 45;
  return revenue * 0.1;
}

export function quarterOfMonth(month: number): 1 | 2 | 3 | 4 {
  return (Math.floor((month - 1) / 3) + 1) as 1 | 2 | 3 | 4;
}

export function quarterMonths(quarter: 1 | 2 | 3 | 4): [number, number, number] {
  const start = (quarter - 1) * 3 + 1;
  return [start, start + 1, start + 2];
}

export function quarterDateRange(year: number, quarter: 1 | 2 | 3 | 4): { start: Date; end: Date } {
  const [firstMonth] = quarterMonths(quarter);
  const start = new Date(year, firstMonth - 1, 1);
  const end = new Date(year, firstMonth + 2, 1); // exclusive, first day of next quarter
  return { start, end };
}

export function monthDateRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}
