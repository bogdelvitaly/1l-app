import { prisma } from "@/lib/prisma";
import { ExpenseModal } from "@/components/ExpenseModal";
import { ExpenseCategoryBadge } from "@/components/ExpenseCategoryBadge";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { RowActions, EditTrigger } from "@/components/RowActions";
import { PlusIcon } from "@/components/icons";
import { createExpense, updateExpense, deleteExpense } from "./actions";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 24-column grid, matching the Figma table exactly. The min-width keeps every
// column readable on narrow viewports instead of squishing — the table
// scrolls horizontally within its container below that width.
const GRID = "grid grid-cols-[repeat(24,minmax(0,1fr))] items-center px-6 min-w-[900px]";
const COLUMNS = [
  { label: "Дата", col: "col-[1/span_3]" },
  { label: "Описание", col: "col-[4/span_9] min-w-[300px]" },
  { label: "Тип затрат", col: "col-[13/span_5]" },
  { label: "Сумма", col: "col-[18/span_5]" },
  { label: "", col: "col-[23/span_2]" },
];

export default async function ExpensesPage(props: PageProps<"/expenses">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = Number(searchParams?.pageSize) || 10;

  const where = q ? { description: { contains: q } } : {};

  const [expenses, total, totalRows, incomeAgg, expenseAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
    prisma.expense.count(),
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
  ]);
  const obshak = (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex flex-col gap-4 sm:min-w-0 sm:flex-row sm:items-center sm:gap-8">
          <h1 className="shrink-0 text-2xl font-extrabold text-[var(--text-primary)]">Расходы</h1>
          <SearchBox />
        </div>
        <ExpenseModal
          title="Добавить расход"
          action={createExpense}
          trigger={
            <button
              type="button"
              className="hidden h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent-orange)] px-5 text-base font-medium whitespace-nowrap text-white hover:brightness-110 sm:flex"
            >
              + Добавить расход
            </button>
          }
        />
      </div>

      <div className="px-4 sm:px-8">
        <div className="flex h-20 items-center gap-3 rounded-xl border border-[var(--devider)] bg-[var(--surface)] p-5">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/figma/wallet-dots-2.svg" alt="" width={16} height={16} />
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">Сумма общака</p>
            <p className="text-xs text-[var(--text-muted)]">{fmt(obshak)} BYN</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-8">
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className={`${GRID} h-12 border-b border-[var(--devider)]`}>
            {COLUMNS.map((col) => (
              <div key={col.label} className={`${col.col} truncate px-2 text-xs font-semibold text-[var(--text-inactive)]`}>
                {col.label}
              </div>
            ))}
          </div>

          {expenses.map((row, i) => (
            <div
              key={row.id}
              className={`${GRID} h-16`}
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="col-[1/span_3] px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.date.toLocaleDateString("ru-RU")}
              </div>
              <div
                className="col-[4/span_9] min-w-[300px] truncate px-2 text-sm font-medium text-[var(--text-primary)]"
                title={row.description}
              >
                {row.description}
              </div>
              <div className="col-[13/span_5] px-2">
                <ExpenseCategoryBadge category={row.category} />
              </div>
              <div className="col-[18/span_5] px-2 text-sm font-medium" style={{ color: "var(--negative)" }}>
                -{fmt(row.amount)}
              </div>
              <div className="col-[23/span_2] px-2">
                <RowActions
                  id={row.id}
                  deleteAction={deleteExpense}
                  editModal={
                    <ExpenseModal
                      title="Изменить расход"
                      action={updateExpense.bind(null, row.id)}
                      trigger={<EditTrigger />}
                      defaults={{
                        date: row.date.toISOString().slice(0, 10),
                        description: row.description,
                        category: row.category,
                        amount: row.amount,
                      }}
                    />
                  }
                />
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="flex h-16 items-center justify-center text-sm text-[var(--text-inactive)]">
              {q ? "Ничего не найдено" : "Пока нет записей"}
            </div>
          )}
        </div>

        {totalRows > 0 && <Pagination page={page} pageSize={pageSize} total={total} />}
      </div>

      <ExpenseModal
        title="Добавить расход"
        action={createExpense}
        trigger={
          <button
            type="button"
            aria-label="Добавить расход"
            className="fixed right-6 bottom-6 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full bg-[var(--accent-orange)] text-white shadow-lg hover:brightness-110 sm:hidden"
          >
            <PlusIcon />
          </button>
        }
      />
    </div>
  );
}
