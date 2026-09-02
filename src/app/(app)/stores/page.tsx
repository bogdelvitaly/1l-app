import { prisma } from "@/lib/prisma";
import { createStore, deleteStore, addStoreProduct, removeStoreProduct } from "./actions";
import { createIncome } from "../income/actions";
import { Badge } from "@/components/Badge";
import { ConfirmDeleteForm } from "@/components/ConfirmDeleteForm";
import { IncomeModal } from "@/components/IncomeModal";

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function StoresPage() {
  const [stores, products, productTypes] = await Promise.all([
    prisma.store.findMany({
      orderBy: { createdAt: "asc" },
      include: { products: { include: { product: { include: { productType: true } } } } },
    }),
    prisma.product.findMany({ include: { productType: true }, orderBy: { createdAt: "asc" } }),
    prisma.productType.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const productsForModal = products.map((p) => ({ id: p.id, name: p.name, productTypeCode: p.productType.code }));

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

                <div className="mb-4 flex flex-col gap-2">
                  {store.products.map((sp) => (
                    <div key={sp.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <Badge color={sp.product.color} label={sp.product.name} />
                      </div>
                      <span className="w-24 shrink-0 text-[var(--text-muted)]">{sp.product.productType.label}</span>
                      <span className="w-20 shrink-0 text-[var(--text-primary)]">{fmt(sp.product.price)} BYN</span>
                      <IncomeModal
                        title="Добавить доход"
                        action={createIncome}
                        productTypes={productTypes}
                        products={productsForModal}
                        defaults={{
                          productId: sp.product.id,
                          city: store.location,
                          amount: sp.product.price,
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
                        className="shrink-0"
                      >
                        <span className="text-[var(--negative)]">✕</span>
                      </ConfirmDeleteForm>
                    </div>
                  ))}
                  {store.products.length === 0 && (
                    <p className="text-center text-sm text-[var(--text-inactive)]">Нет товаров в магазине</p>
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
