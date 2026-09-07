"use client";

import { useRef } from "react";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, INCOME_SOURCES, INCOME_SOURCE_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { Field, inputClass } from "./form-fields";

type Product = { id: string; name: string; price: number };

export function AddOrderModal({
  trigger,
  action,
  products,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => void;
  products: Product[];
}) {
  return (
    <Modal trigger={trigger} title="Добавить заказ">
      {(close) => {
        async function handleSubmit(formData: FormData) {
          await action(formData);
          close();
        }

        return <OrderForm handleSubmit={handleSubmit} products={products} />;
      }}
    </Modal>
  );
}

function OrderForm({ handleSubmit, products }: { handleSubmit: (formData: FormData) => void; products: Product[] }) {
  const amountRef = useRef<HTMLInputElement | null>(null);

  function onProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const product = products.find((p) => p.id === e.target.value);
    if (product && amountRef.current) {
      amountRef.current.value = String(product.price);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Товар" required>
          <select name="productId" required defaultValue="" onChange={onProductChange} className={inputClass}>
            <option value="" disabled>
              Выберите...
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Срок выполнения">
          <input type="date" name="due" className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Детали продажи">
          <input name="saleDetails" className={inputClass} />
        </Field>
        <Field label="Источник" required>
          <select name="source" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Выберите...
            </option>
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {INCOME_SOURCE_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Покупатель">
          <input name="buyer" placeholder="Введите..." className={inputClass} />
        </Field>
        <Field label="Город" required>
          <input name="city" required placeholder="Введите..." className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Сумма (BYN)" required>
          <input ref={amountRef} type="number" step="0.01" name="amount" required className={inputClass} />
        </Field>
        <Field label="Нал/безнал" required>
          <select name="paymentMethod" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Выберите...
            </option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {PAYMENT_METHOD_LABELS[pm]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Отправка">
          <input type="number" step="0.01" name="shipping" defaultValue={0} className={inputClass} />
        </Field>
        <Field label="Доставка">
          <input type="number" step="0.01" name="delivery" defaultValue={0} className={inputClass} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        <input
          type="checkbox"
          name="taxable"
          defaultChecked
          className="size-4 cursor-pointer accent-[var(--accent-orange)]"
        />
        Облагается налогом
      </label>

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110"
      >
        Добавить заказ
      </button>
    </form>
  );
}
