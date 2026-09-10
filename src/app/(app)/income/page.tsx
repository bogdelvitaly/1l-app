import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_SHORT_LABELS, INCOME_SOURCE_LABELS } from "@/lib/types";
import { IncomeModal } from "@/components/IncomeModal";
import { AutoOpenIncomeModal } from "@/components/AutoOpenIncomeModal";
import { TypeBadge } from "@/components/TypeBadge";
import { Badge } from "@/components/Badge";
import { SearchBox } from "@/components/SearchBox";
import { Pagination } from "@/components/Pagination";
import { RowActions, EditTrigger } from "@/components/RowActions";
import { PlusIcon } from "@/components/icons";
import { createIncome, updateIncome, deleteIncome } from "./actions";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 32-column grid: №, Товар, Покупатель, Дата, Город, Источник, Детали (wide),
// Сумма, Нал/безнал, Отправка/Доставка (merged), Тип, Действия.
const GRID = "grid grid-cols-[repeat(32,minmax(0,1fr))] items-center px-6 min-w-[1500px]";
const COLUMNS = [
  { label: "№", col: "col-[1/span_1]" },
  { label: "Товар", col: "col-[2/span_3]" },
  { label: "Покупатель", col: "col-[5/span_3]" },
  { label: "Дата", col: "col-[8/span_2]" },
  { label: "Город", col: "col-[10/span_3]" },
  { label: "Источник", col: "col-[13/span_3]" },
  { label: "Детали", col: "col-[16/span_6] min-w-[220px]" },
  { label: "Сумма", col: "col-[22/span_2]" },
  { label: "Нал/безнал", col: "col-[24/span_2]" },
  { label: "Отправка/Доставка", col: "col-[26/span_3]" },
  { label: "Тип", col: "col-[29/span_2]" },
  { label: "", col: "col-[31/span_2]" },
];

export default async function IncomePage(props: PageProps<"/income">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams?.q === "string" ? searchParams.q : "";
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const pageSize = Number(searchParams?.pageSize) || 10;
  // Set by the "Доход добавлен" link on a Заказы card (see QuickIncomeModal) — opens
  // that record's edit modal on load regardless of which page it'd fall on.
  const openId = typeof searchParams?.open === "string" ? searchParams.open : undefined;

  const where = q ? { saleDetails: { contains: q } } : {};

  const [incomes, total, incomeAgg, expenseAgg, productTypes, products, openIncome] = await Promise.all([
    prisma.income.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { product: true },
    }),
    prisma.income.count({ where }),
    prisma.income.aggregate({ _sum: { amount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.productType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    openId ? prisma.income.findUnique({ where: { id: openId } }) : null,
  ]);
  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, price: p.price }));

  const obshak = (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0);
  const typeLabel = new Map(productTypes.map((pt) => [pt.code, pt.label]));
  const totalRows = await prisma.income.count();

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex flex-col gap-4 sm:min-w-0 sm:flex-row sm:items-center sm:gap-8">
          <h1 className="shrink-0 text-2xl font-extrabold text-[var(--text-primary)]">Доходы</h1>
          <SearchBox />
        </div>
        <IncomeModal
          title="Добавить доход"
          action={createIncome}
          products={productsForModal}
          trigger={
            <button
              type="button"
              className="hidden h-11 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[var(--accent-orange)] px-5 text-base font-medium whitespace-nowrap text-white hover:brightness-110 sm:flex"
            >
              + Добавить доход
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

          {incomes.map((row, i) => (
            <div
              key={row.id}
              className={`${GRID} h-16`}
              style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
            >
              <div className="col-[1/span_1] px-2 text-sm font-medium text-[var(--text-primary)]">
                {total - ((page - 1) * pageSize + i)}
              </div>
              <div className="col-[2/span_3] px-2">
                {row.product ? <Badge color={row.product.color} label={row.product.name} /> : "-"}
              </div>
              <div className="col-[5/span_3] truncate px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.buyer || "-"}
              </div>
              <div className="col-[8/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.date.toLocaleDateString("ru-RU")}
              </div>
              <div className="col-[10/span_3] truncate px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.city || "-"}
              </div>
              <div className="col-[13/span_3] truncate px-2 text-sm font-medium text-[var(--text-primary)]">
                {row.source ? (INCOME_SOURCE_LABELS[row.source as keyof typeof INCOME_SOURCE_LABELS] ?? row.source) : "-"}
              </div>
              <div
                className="col-[16/span_6] min-w-[220px] truncate px-2 text-sm font-medium text-[var(--text-primary)]"
                title={row.saleDetails ?? undefined}
              >
                {row.saleDetails || "-"}
              </div>
              <div className="col-[22/span_2] px-2 text-sm font-medium text-[var(--text-primary)]">
                {fmt(row.amount)} BYN
              </div>
              <div className="col-[24/span_2] truncate px-2 text-sm font-medium text-[var(--text-primary)]">
                {PAYMENT_METHOD_SHORT_LABELS[row.paymentMethod as keyof typeof PAYMENT_METHOD_SHORT_LABELS] ??
                  row.paymentMethod}
              </div>
              <div className="col-[26/span_3] px-2 text-xs font-medium text-[var(--text-primary)]">
                {row.shipping > 0 && <div>Отправка {fmt(row.shipping)}</div>}
                {row.delivery > 0 && <div>Доставка {fmt(row.delivery)}</div>}
                {row.shipping <= 0 && row.delivery <= 0 && "-"}
              </div>
              <div className="col-[29/span_2] px-2">
                {row.productType ? (
                  <TypeBadge code={row.productType} label={typeLabel.get(row.productType) ?? row.productType} />
                ) : (
                  "-"
                )}
              </div>
              <div className="col-[31/span_2] px-2">
                <RowActions
                  id={row.id}
                  deleteAction={deleteIncome}
                  editModal={
                    <IncomeModal
                      title="Изменить доход"
                      action={updateIncome.bind(null, row.id)}
                      products={productsForModal}
                      trigger={<EditTrigger />}
                      defaults={{
                        date: row.date.toISOString().slice(0, 10),
                        saleDetails: row.saleDetails ?? undefined,
                        amount: row.amount,
                        shipping: row.shipping,
                        delivery: row.delivery,
                        paymentMethod: row.paymentMethod,
                        productId: row.productId ?? undefined,
                        buyer: row.buyer ?? undefined,
                        city: row.city ?? undefined,
                        source: row.source ?? undefined,
                        taxable: row.taxable,
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

      <IncomeModal
        title="Добавить доход"
        action={createIncome}
        products={productsForModal}
        trigger={
          <button
            type="button"
            aria-label="Добавить доход"
            className="fixed right-6 bottom-6 z-40 flex size-14 cursor-pointer items-center justify-center rounded-full bg-[var(--accent-orange)] text-white shadow-lg hover:brightness-110 sm:hidden"
          >
            <PlusIcon />
          </button>
        }
      />

      {openIncome && (
        <AutoOpenIncomeModal
          action={updateIncome.bind(null, openIncome.id)}
          products={productsForModal}
          defaults={{
            date: openIncome.date.toISOString().slice(0, 10),
            saleDetails: openIncome.saleDetails ?? undefined,
            amount: openIncome.amount,
            shipping: openIncome.shipping,
            delivery: openIncome.delivery,
            paymentMethod: openIncome.paymentMethod,
            productId: openIncome.productId ?? undefined,
            buyer: openIncome.buyer ?? undefined,
            city: openIncome.city ?? undefined,
            source: openIncome.source ?? undefined,
            taxable: openIncome.taxable,
          }}
        />
      )}
    </div>
  );
}
