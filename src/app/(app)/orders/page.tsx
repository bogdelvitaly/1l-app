import { getBoardData } from "@/lib/trello";
import { reconcileDoneOrders } from "@/lib/orderSync";
import { prisma } from "@/lib/prisma";
import { OrdersBoard } from "@/components/OrdersBoard";
import { OrderModal } from "@/components/OrderModal";
import { createOrderAction } from "./actions";

export default async function OrdersPage() {
  const [{ lists, cardsByList }, products] = await Promise.all([
    getBoardData(),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, price: p.price }));
  // Removes incomes for cards no longer in Done (moved here or directly in Trello),
  // and reports cards that are in Done but need an income created still.
  const { pendingReview } = await reconcileDoneOrders(lists, cardsByList);

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
        pendingReviewCards={pendingReview}
      />
    </div>
  );
}
