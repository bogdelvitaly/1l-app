"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { quarterMonths, FULL_MONTH_LABELS } from "@/lib/formulas";

const selectClass =
  "h-9 cursor-pointer rounded-md border border-[var(--devider)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text-primary)] focus:outline-none";

export function ReportPeriodFilters({
  years,
  year,
  quarter,
  month,
}: {
  years: number[];
  year: number;
  quarter: 1 | 2 | 3 | 4;
  month?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(next: { year?: number; quarter?: number; month?: number | null }) {
    const params = new URLSearchParams(searchParams);
    if (next.year !== undefined) params.set("year", String(next.year));
    if (next.quarter !== undefined) params.set("quarter", String(next.quarter));
    if (next.month === null) params.delete("month");
    else if (next.month !== undefined) params.set("month", String(next.month));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={year}
        onChange={(e) => navigate({ year: Number(e.target.value) })}
        className={selectClass}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={quarter}
        onChange={(e) => navigate({ quarter: Number(e.target.value), month: null })}
        className={selectClass}
      >
        {([1, 2, 3, 4] as const).map((q) => (
          <option key={q} value={q}>
            Q{q}
          </option>
        ))}
      </select>
      <select
        value={month ?? ""}
        onChange={(e) => navigate({ month: e.target.value ? Number(e.target.value) : null })}
        className={selectClass}
      >
        <option value="">Весь квартал</option>
        {quarterMonths(quarter).map((m) => (
          <option key={m} value={m}>
            {FULL_MONTH_LABELS[m - 1]}
          </option>
        ))}
      </select>
    </div>
  );
}
