import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_SHORT_LABELS } from "@/lib/types";
import { IncomeModal } from "@/components/IncomeModal";
import { TypeBadge } from "@/components/TypeBadge";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { RowActions, EditTrigger } from "@/components/RowActions";
import { createIncome, updateIncome, deleteIncome } from "./actions";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 24-column grid, matching the Figma table exactly.
const GRID = "grid grid-cols-[repeat(24,minmax(0,1fr))] items-center px-6";
const COLUMNS = [
  { label: "№", col: "col-[1/span_1]" },
  { label: "Дата", col: "col-[2/span_2]" },
  { label: "Детали продажи", col: "col-[4/span_9] min-w-[300px]" },
  { label: "Сумма", col: "col-[13/span_2]" },
  { label: "Отправка", col: "col-[15/span_2]" },
  { label: "Доставка", col: "col-[17/span_2]" },
  { label: "Нал/безнал", col: "col-[19/span_2]" },
  { label: "Тип", col: "col-[21/span_2]" },
  { label: "", col: "col-[23/span_2]" },
];

export default async function IncomePage(props: PageProps<"/income">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = Number(searchParams?.pageSize) || 10;

  const where = q ? { saleDetails: { contains: q } } : {};

  const [incomes, total, incomeAgg, expenseAgg, productTypes] = await Promise.all([
    prisma.income.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.productType.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const obshak = (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0);
  const typeLabel = new Map(productTypes.map((pt) => [pt.code, pt.label]));
  const totalRows = await prisma.income.count();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 p-8">
        <div className="flex min-w-0 items-center gap-8">
          <h1 className="shrink-0 text-2xl font-extrabold text-[var(--text-primary)]">Доходы</h1>
          <SearchBox />
        </div>
        <IncomeModal
          title="Добавить доход"
          action={createIncome}
          productTypes={productTypes}
          trigger={
            <button
              type="button"
              className="flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent-orange)] px-5 text-base font-medium whitespace-nowrap text-white hover:brightness-110"
            >
              + Добавить доход
            </button>
          }
        />
      </div>

      <div className="px-8">
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

      <div className="flex flex-col gap-3 p-8">
        <div className="w-full rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
          <div className={`${GRID} h-12 border-b border-[var(--devider)]`}>
            {COLUMNS.map((col) => (
              <div key={col.label} className={`${col.col} truncate px-2 text-xs font-semibold text-[var(--text-inactive)]`}>
                {col.label}
              </div>
            ))}
          </div>

          {incomes.map((row, i) => (
            <div
              key={row.id}
              className={`${GRID} h-16`}
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="col-[1/span_1] px-2 text-sm font-medium text-[var(--text-primary)]">
                {total - ((page - 1) * pageSize + i)}
              </div>
              <div className="col-[2/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.date.toLocaleDateString("ru-RU")}
              </div>
              <div
                className="col-[4/span_9] min-w-[300px] truncate px-2 text-sm font-medium text-[var(--text-primary)]"
                title={row.saleDetails}
              >
                {row.saleDetails}
              </div>
              <div className="col-[13/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {fmt(row.amount)} BYN
              </div>
              <div className="col-[15/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.shipping ? fmt(row.shipping) : "-"}
              </div>
              <div className="col-[17/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.delivery ? fmt(row.delivery) : "-"}
              </div>
              <div className="col-[19/span_2] truncate px-2 text-sm font-medium text-[var(--text-primary)]">
                {PAYMENT_METHOD_SHORT_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_SHORT_LABELS] ??
                  row.paymentMethod}
              </div>
              <div className="col-[21/span_2] px-2">
                <TypeBadge code={row.productType} label={typeLabel.get(row.productType) ?? row.productType} />
              </div>
              <div className="col-[23/span_2] px-2">
                <RowActions
                  id={row.id}
                  deleteAction={deleteIncome}
                  editModal={
                    <IncomeModal
                      title="Изменить доход"
                      action={updateIncome.bind(null, row.id)}
                      productTypes={productTypes}
                      trigger={<EditTrigger />}
                      defaults={{
                        date: row.date.toISOString().slice(0, 10),
                        saleDetails: row.saleDetails,
                        amount: row.amount,
                        shipping: row.shipping,
                        delivery: row.delivery,
                        paymentMethod: row.paymentMethod,
                        productType: row.productType,
                      }}
                    />
                  }
                />
              </div>
            </div>
          ))}

          {incomes.length === 0 && (
            <div className="flex h-16 items-center justify-center text-sm text-[var(--text-inactive)]">
              {q ? "Ничего не найдено" : "Пока нет записей"}
            </div>
          )}
        </div>

        {totalRows > 0 && <Pagination page={page} pageSize={pageSize} total={total} />}
      </div>
    </div>
  );
}
