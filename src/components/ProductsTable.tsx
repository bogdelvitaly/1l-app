"use client";

import { useState } from "react";
import { deleteProduct, reorderProducts, updateProduct } from "@/app/(app)/settings/actions";
import { Badge } from "./Badge";
import { ConfirmDeleteForm } from "./ConfirmDeleteForm";
import { ProductModal } from "./ProductModal";
import { EditTrigger } from "./RowActions";
import { GripIcon } from "./icons";

type Product = { id: string; name: string; price: number; color: string; productTypeId: string; typeLabel: string };
type ProductType = { id: string; label: string };

function fmt(n: number) {
  return n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ProductsTable({ products, productTypes }: { products: Product[]; productTypes: ProductType[] }) {
  const [items, setItems] = useState(products);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === targetId) return;

    const from = items.findIndex((p) => p.id === fromId);
    const to = items.findIndex((p) => p.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const previous = items;
    setItems(next);
    reorderProducts(next.map((p) => p.id)).catch(() => setItems(previous));
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[var(--devider)] bg-[var(--surface)]">
      <div className="flex h-12 min-w-[700px] items-center border-b border-[var(--devider)] px-6">
        <div className="w-8 shrink-0" />
        <div className="min-w-[200px] flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Имя</div>
        <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Тип товара</div>
        <div className="flex-1 px-2 text-xs font-semibold text-[var(--text-muted)]">Сумма</div>
        <div className="w-24 shrink-0 px-2" />
      </div>

      {items.map((p, i) => (
        <div
          key={p.id}
          data-row
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            setOverId(p.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(p.id);
          }}
          className={`flex h-16 min-w-[700px] items-center px-6 ${dragId === p.id ? "opacity-40" : ""}`}
          style={{
            backgroundColor: i % 2 === 1 ? "rgba(123,160,175,0.05)" : undefined,
            boxShadow: overId === p.id && dragId !== p.id ? "inset 0 2px 0 var(--accent-orange)" : undefined,
          }}
        >
          <div
            draggable
            aria-label="Перетащить"
            title="Перетащить, чтобы изменить порядок"
            onDragStart={(e) => {
              setDragId(p.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", p.id);
              const row = e.currentTarget.closest("[data-row]");
              if (row) e.dataTransfer.setDragImage(row, 24, 24);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className="flex w-8 shrink-0 cursor-grab items-center text-[var(--text-inactive)] hover:text-[var(--text-primary)] active:cursor-grabbing"
          >
            <GripIcon />
          </div>
          <div className="min-w-[200px] flex-1 px-2">
            <Badge color={p.color} label={p.name} />
          </div>
          <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{p.typeLabel}</div>
          <div className="flex-1 px-2 text-sm font-medium text-[var(--text-primary)]">{fmt(p.price)} BYN</div>
          <div className="flex w-24 shrink-0 items-center justify-end gap-4 px-2">
            <ProductModal
              title="Изменить товар"
              action={updateProduct.bind(null, p.id)}
              productTypes={productTypes}
              defaults={{ name: p.name, price: p.price, color: p.color, productTypeId: p.productTypeId }}
              trigger={<EditTrigger />}
            />
            <ConfirmDeleteForm action={deleteProduct} id={p.id} ariaLabel="Удалить товар" className="cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
            </ConfirmDeleteForm>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">Пока нет товаров</div>
      )}
    </div>
  );
}
