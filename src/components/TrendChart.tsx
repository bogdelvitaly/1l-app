"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type TrendPoint = { month: number; label: string; brutto: number; ostatok: number };

function fmtCompact(n: number) {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const ostatok = payload.find((p) => p.dataKey === "ostatok")?.value ?? 0;
  const brutto = payload.find((p) => p.dataKey === "brutto")?.value ?? 0;
  return (
    <div className="rounded-lg border border-[var(--devider)] bg-[var(--surface)] px-4 py-3 shadow-lg">
      <p className="mb-1 text-[10px] text-[var(--text-muted)]">{label} 2026</p>
      <p className="text-sm text-[var(--text-primary)]">
        Остаток: <span className="font-semibold" style={{ color: "var(--accent-orange)" }}>{fmtCompact(ostatok)} BYN</span>
      </p>
      <p className="text-sm text-[var(--text-primary)]">
        Брутто: <span className="font-semibold" style={{ color: "var(--accent-blue)" }}>{fmtCompact(brutto)} BYN</span>
      </p>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ostatokFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-orange)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent-orange)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bruttoFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--devider)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--text-muted)", fontSize: 10 }}
          axisLine={{ stroke: "var(--devider)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtCompact}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="brutto" stroke="var(--accent-blue)" fill="url(#bruttoFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="ostatok" stroke="var(--accent-orange)" fill="url(#ostatokFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
