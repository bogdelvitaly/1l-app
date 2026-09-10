import { getBoardData } from "@/lib/trello";
import { prisma } from "@/lib/prisma";
import { OrdersBoard } from "@/components/OrdersBoard";
import { OrderModal } from "@/components/OrderModal";
import { createOrderAction } from "./actions";

export default async function OrdersPage() {
  const [{ lists, cardsByList }, products, linkedIncomes] = await Promise.all([
    getBoardData(),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    // Which cards already have a "Добавить доход" row — see quickAddIncomeAction —
    // so their card shows "Доход добавлен" instead of the button.
    prisma.income.findMany({ where: { trelloCardId: { not: null } }, select: { id: true, trelloCardId: true } }),
  ]);
  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, price: p.price }));
  const incomeByCardId = Object.fromEntries(linkedIncomes.map((i) => [i.trelloCardId as string, i.id]));

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Заказы</h1>
        <OrderModal
          title="Добавить заказ"
          submitLabel="Добавить заказ"
          action={createOrderAction}
          products={productsForModal}
          trigger={
            <button
              type="button"
              className="h-11 shrink-0 cursor-pointer rounded-lg bg-[var(--accent-orange)] px-5 text-base font-medium whitespace-nowrap text-white hover:brightness-110"
            >
              + Добавить заказ
            </button>
          }
        />
      </div>
      <OrdersBoard
        lists={lists}
        cardsByList={cardsByList}
        products={productsForModal}
        incomeByCardId={incomeByCardId}
      />
    </div>
  );
}
