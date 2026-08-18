import { prisma } from "@/lib/prisma";

const ENTITY_LABELS: Record<string, string> = {
  Expense: "Расход",
  Income: "Доход",
  Certificate: "Сертификат",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Создано",
  update: "Изменено",
  delete: "Удалено",
};

// 24-column grid, matching the style used across Доходы/Расходы tables.
const GRID = "grid grid-cols-[repeat(24,minmax(0,1fr))] px-6 min-w-[1000px]";
const COLUMNS = [
  { label: "Когда", col: "col-[1/span_4]" },
  { label: "Кто", col: "col-[5/span_3]" },
  { label: "Что", col: "col-[8/span_3]" },
  { label: "Действие", col: "col-[11/span_3]" },
  { label: "Детали", col: "col-[14/span_11] min-w-[300px]" },
];

export default async function HistoryPage() {
  const logs = await prisma.changeLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  return (
    <div className="flex flex-col">
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">История</h1>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 sm:px-8 sm:pb-8">
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className={`${GRID} h-12 items-center border-b border-[var(--devider)]`}>
            {COLUMNS.map((col) => (
              <div key={col.label} className={`${col.col} truncate px-2 text-xs font-semibold text-[var(--text-inactive)]`}>
                {col.label}
              </div>
            ))}
          </div>

          {logs.map((log, i) => (
            <div
              key={log.id}
              className={`${GRID} min-h-16 items-center py-3`}
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="col-[1/span_4] px-2 text-sm font-medium whitespace-nowrap text-[var(--text-primary)]">
                {log.createdAt.toLocaleString("ru-RU")}
              </div>
              <div className="col-[5/span_3] px-2 text-sm font-medium text-[var(--text-primary)]">
                {log.user.username}
              </div>
              <div className="col-[8/span_3] px-2 text-sm font-medium text-[var(--text-primary)]">
                {ENTITY_LABELS[log.entityType] ?? log.entityType}
              </div>
              <div className="col-[11/span_3] px-2 text-sm font-medium text-[var(--text-primary)]">
                {ACTION_LABELS[log.action] ?? log.action}
              </div>
              <div className="col-[14/span_11] min-w-[300px] px-2 text-xs break-all text-[var(--text-muted)]">
                {log.diff}
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="flex h-16 items-center justify-center text-sm text-[var(--text-inactive)]">
              Пока нет изменений
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
