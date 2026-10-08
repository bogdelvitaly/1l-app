import { prisma } from "@/lib/prisma";
import { PRODUCT_ORDER } from "@/lib/productOrder";
import { createStore, deleteStore, addStoreProduct, removeStoreProduct, sellStoreProduct } from "./actions";
import { Badge } from "@/components/Badge";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { IncomeModal } from "@/components/IncomeModal";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Same 32-column grid approach as the Доходы table, so rows line up and long
// type labels truncate instead of wrapping into the neighbouring columns.
const GRID = "grid grid-cols-[repeat(32,minmax(0,1fr))] items-center px-6 min-w-[820px]";
const COLUMNS = [
  { label: "Товар", col: "col-[1/span_9]" },
  { label: "Тип", col: "col-[10/span_12]" },
  { label: "Сумма", col: "col-[22/span_5]" },
  { label: "", col: "col-[27/span_6]" },
];

export default async function StoresPage() {
  const [stores, products] = await Promise.all([
    prisma.store.findMany({
      orderBy: { createdAt: "asc" },
      include: { products: { include: { product: { include: { productType: true } } } } },
    }),
    prisma.product.findMany({ include: { productType: true }, orderBy: PRODUCT_ORDER }),
  ]);

  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, price: p.price }));

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Магазины</h1>
      </div>

      <div className="flex flex-col gap-6 px-4 pb-4 sm:px-8 sm:pb-8">
        <form action={createStore} className="flex flex-wrap items-end gap-4 rounded-xl bg-[var(--surface)] p-6">
          <label className="flex w-[220px] flex-col gap-2 text-xs text-[var(--text-muted)]">
            Имя
            <input
              name="name"
              required
              placeholder="Введите..."
              className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
            />
          </label>
          <label className="flex w-[220px] flex-col gap-2 text-xs text-[var(--text-muted)]">
            Локация
            <input
              name="location"
              required
              placeholder="Введите..."
              className="h-10 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110"
          >
            Добавить магазин
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {stores.map((store) => {
            const storeProductIds = new Set(store.products.map((sp) => sp.productId));
            const availableProducts = products.filter((p) => !storeProductIds.has(p.id));

            return (
              <div key={store.id} className="rounded-xl bg-[var(--surface)] p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-[var(--text-primary)]">{store.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{store.location}</div>
                  </div>
                  <ConfirmDeleteForm action={deleteStore} id={store.id} ariaLabel="Удалить магазин">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
                  </ConfirmDeleteForm>
                </div>

                <div className="mb-4 w-full overflow-x-auto rounded-xl border border-[var(--devider)]">
                  <div className={`${GRID} h-12 border-b border-[var(--devider)]`}>
                    {COLUMNS.map((col) => (
                      <div
                        key={col.label || "actions"}
                        className={`${col.col} truncate px-2 text-xs font-semibold text-[var(--text-inactive)]`}
                      >
                        {col.label}
                      </div>
                    ))}
                  </div>

                  {store.products.map((sp, i) => (
                    <div
                      key={sp.id}
                      className={`${GRID} h-16`}
                      style={i % 2 === 1 ? { backgroundColor: "rgba(123,160,175,0.05)" } : undefined}
                    >
                      <div className="col-[1/span_9] px-2">
                        <Badge color={sp.product.color} label={sp.product.name} />
                      </div>
                      <div
                        className="col-[10/span_12] truncate px-2 text-sm font-medium text-[var(--text-primary)]"
                        title={sp.product.productType.label}
                      >
                        {sp.product.productType.label}
                      </div>
                      <div className="col-[22/span_5] px-2 text-sm font-medium text-[var(--text-primary)]">
                        {fmt(sp.product.price)} BYN
                      </div>
                      <div className="col-[27/span_6] flex items-center justify-end gap-4 px-2">
                        <IncomeModal
                          title="Добавить доход"
                          action={sellStoreProduct.bind(null, sp.id)}
                          products={productsForModal}
                          defaults={{
                            productId: sp.product.id,
                            city: store.location,
                            amount: sp.product.price,
                            source: "STORE",
                            saleDetails: `${store.name}, ${store.location}`,
                          }}
                          trigger={
                            <button
                              type="button"
                              className="shrink-0 cursor-pointer rounded-lg bg-[var(--accent-orange)] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:brightness-110"
                            >
                              Продано
                            </button>
                          }
                        />
                        <ConfirmDeleteForm
                          action={removeStoreProduct}
                          id={sp.id}
                          ariaLabel="Убрать из магазина"
                          className="shrink-0 cursor-pointer"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
                        </ConfirmDeleteForm>
                      </div>
                    </div>
                  ))}
                  {store.products.length === 0 && (
                    <div className="flex h-16 items-center justify-center text-sm text-[var(--text-inactive)]">
                      Нет товаров в магазине
                    </div>
                  )}
                </div>

                {availableProducts.length > 0 && (
                  <form action={addStoreProduct} className="flex gap-2">
                    <input type="hidden" name="storeId" value={store.id} />
                    <select
                      name="productId"
                      required
                      defaultValue=""
                      className="h-10 min-w-0 flex-1 rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] focus:outline-none"
                    >
                      <option value="" disabled>
                        Выберите товар из каталога...
                      </option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-orange)] text-white hover:brightness-110"
                    >
                      +
                    </button>
                  </form>
                )}
              </div>
            );
          })}

          {stores.length === 0 && (
            <p className="rounded-xl bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
              Пока нет магазинов
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
