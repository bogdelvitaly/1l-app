import Link from "next/link";
import { getQuarterlyReport, getMonthlyTrend } from "@/lib/reports";
import { TrendChart } from "@/components/TrendChart";
import { shortProductTypeLabel } from "@/lib/typeColors";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentQuarter(): 1 | 2 | 3 | 4 {
  return (Math.floor(new Date().getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
}

function prevQuarter(year: number, quarter: 1 | 2 | 3 | 4): { year: number; quarter: 1 | 2 | 3 | 4 } {
  return quarter === 1 ? { year: year - 1, quarter: 4 } : { year, quarter: (quarter - 1) as 1 | 2 | 3 | 4 };
}

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;
  const year = Number(searchParams?.year) || new Date().getFullYear();
  const quarter = (Number(searchParams?.quarter) || currentQuarter()) as 1 | 2 | 3 | 4;
  const prev = prevQuarter(year, quarter);

  const [report, prevReport, trend] = await Promise.all([
    getQuarterlyReport(year, quarter),
    getQuarterlyReport(prev.year, prev.quarter),
    getMonthlyTrend(year),
  ]);

  const change = prevReport.ostatok !== 0 ? ((report.ostatok - prevReport.ostatok) / Math.abs(prevReport.ostatok)) * 100 : 0;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Отчёты</h1>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {years.map((y) => (
              <Link
                key={y}
                href={`/reports?year=${y}&quarter=${quarter}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  y === year
                    ? "bg-[var(--accent-blue)] text-white"
                    : "text-[var(--text-inactive)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
          <div className="flex gap-1">
            {([1, 2, 3, 4] as const).map((q) => (
              <Link
                key={q}
                href={`/reports?year=${year}&quarter=${q}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  q === quarter
                    ? "bg-[var(--accent-blue)] text-white"
                    : "text-[var(--text-inactive)] hover:bg-[var(--surface-hover)]"
                }`}
              >
                Q{q}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-8 pb-8">
        <div className="rounded-xl bg-[var(--surface)] p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-muted)]">Остаток за квартал</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-semibold text-[var(--text-primary)]">{fmt(report.ostatok)} BYN</span>
                <ChangeBadge value={change} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Legend color="var(--accent-orange)" label="Остаток" />
              <Legend color="var(--accent-blue)" label="Брутто" />
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Аренда мастерской" value={report.masterskaya} />
          <StatCard label="Развитие по факту" value={report.razvitieFakt} />
          <StatCard label="Пересылка" value={report.peresylka} />
          <StatCard label="Налог за квартал" value={report.quarterTax} />
        </div>

        <div className="w-full rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className="flex h-12 items-center border-b border-[var(--devider)] px-6">
            {["Товар", "Количество", "Сумма брутто", "Сумма нетто", "Себестоимость", "Налог за квартал"].map((h) => (
              <div key={h} className="flex-1 px-2 text-xs font-semibold text-[var(--text-inactive)]">
                {h}
              </div>
            ))}
          </div>
          {report.productRows.map((row, i) => (
            <div
              key={row.productType}
              className="flex h-16 items-center px-6"
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">
                {shortProductTypeLabel(row.label)}
              </div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{row.count}</div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(row.brutto)}</div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(row.netto)}</div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(row.cost)}</div>
              <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(row.tax)}</div>
            </div>
          ))}
          {report.productRows.length === 0 && (
            <div className="flex h-16 items-center justify-center text-sm text-[var(--text-inactive)]">
              Нет продаж за этот квартал
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[var(--surface)] p-6">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">{fmt(value)} BYN</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-[7px] rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const color = positive ? "#14ca74" : "#f31a1a";
  return (
    <span
      className="rounded-sm px-1 py-0.5 text-[10px] font-medium"
      style={{ color, backgroundColor: `${color}33` }}
    >
      {positive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
