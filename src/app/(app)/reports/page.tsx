import { getQuarterlyReport, getMonthlyReport, getMonthlyTrend } from "@/lib/reports";
import { quarterMonths, FULL_MONTH_LABELS } from "@/lib/formulas";
import { TrendChart } from "@/components/TrendChart";
import { ReportPeriodFilters } from "@/components/ReportPeriodFilters";
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

function prevMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function pctChange(current: number, previous: number) {
  return previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;
}

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;
  const year = Number(searchParams?.year) || new Date().getFullYear();
  const quarter = (Number(searchParams?.quarter) || currentQuarter()) as 1 | 2 | 3 | 4;
  const rawMonth = searchParams?.month ? Number(searchParams.month) : undefined;
  const month = rawMonth && (quarterMonths(quarter) as readonly number[]).includes(rawMonth) ? rawMonth : undefined;

  const prev = month ? prevMonth(year, month) : prevQuarter(year, quarter);

  const [report, prevReport, trend] = await Promise.all([
    month ? getMonthlyReport(year, month) : getQuarterlyReport(year, quarter),
    "month" in prev ? getMonthlyReport(prev.year, prev.month) : getQuarterlyReport(prev.year, prev.quarter),
    getMonthlyTrend(year),
  ]);

  const ostatokChange = pctChange(report.ostatok, prevReport.ostatok);
  const bruttoChange = pctChange(report.brutto, prevReport.brutto);

  const ostatokLabel = month ? `Остаток за ${FULL_MONTH_LABELS[month - 1].toLowerCase()}` : "Остаток за квартал";
  const bruttoLabel = month ? `Брутто за ${FULL_MONTH_LABELS[month - 1].toLowerCase()}` : "Брутто за квартал";

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Отчёты</h1>
        <ReportPeriodFilters years={years} year={year} quarter={quarter} month={month} />
      </div>

      <div className="flex flex-col gap-6 px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="rounded-xl bg-[var(--surface)] p-4 sm:p-8">
          <div className="mb-4 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
              <div>
                <p className="text-sm text-[var(--text-muted)]">{ostatokLabel}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-semibold text-[var(--text-primary)]">{fmt(report.ostatok)} BYN</span>
                  <ChangeBadge value={ostatokChange} />
                </div>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">{bruttoLabel}</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-semibold text-[var(--text-primary)]">{fmt(report.brutto)} BYN</span>
                  <ChangeBadge value={bruttoChange} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Legend color="var(--accent-orange)" label="Остаток" />
              <Legend color="var(--accent-blue)" label="Брутто" />
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Аренда мастерской" value={report.masterskaya} />
          <StatCard label="Развитие по факту" value={report.razvitieFakt} />
          <StatCard label="Пересылка" value={report.peresylka} />
          <StatCard label="Налог за квартал" value={report.tax} />
          <StatCard label="Ожидаемый налог" value={report.expectedTax} />
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className="flex h-12 min-w-[700px] items-center border-b border-[var(--devider)] px-6">
            {["Товар", "Количество", "Сумма брутто", "Сумма нетто", "Себестоимость", "Налог за квартал"].map((h) => (
              <div key={h} className="flex-1 px-2 text-xs font-semibold text-[var(--text-inactive)]">
                {h}
              </div>
            ))}
          </div>
          {report.productRows.map((row, i) => (
            <div
              key={row.productType}
              className="flex h-16 min-w-[700px] items-center px-6"
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
              Нет продаж за этот период
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
