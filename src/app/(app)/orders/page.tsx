import { getBoardData } from "@/lib/trello";
import { prisma } from "@/lib/prisma";
import { OrdersBoard } from "@/components/OrdersBoard";

export default async function OrdersPage() {
  const [{ lists, cardsByList }, products] = await Promise.all([
    getBoardData(),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
  ]);
  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, price: p.price }));

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Заказы</h1>
      </div>
      <OrdersBoard lists={lists} cardsByList={cardsByList} products={productsForModal} />
    </div>
  );
}
