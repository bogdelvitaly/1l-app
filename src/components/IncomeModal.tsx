"use client";

import { useRef } from "react";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, INCOME_SOURCES, INCOME_SOURCE_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { DateInput, Field, inputClass } from "./form-fields";

type IncomeDefaults = {
  date?: string;
  saleDetails?: string;
  amount?: number;
  shipping?: number;
  delivery?: number;
  paymentMethod?: string;
  productId?: string;
  buyer?: string;
  city?: string;
  source?: string;
  taxable?: boolean;
};

type Product = { id: string; name: string; price: number };

export function IncomeModal({
  trigger,
  title,
  action,
  defaults,
  products,
  trelloCardId,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  defaults?: IncomeDefaults;
  products: Product[];
  // Set when this form was opened from a Заказы card — see OrdersBoard — so
  // createIncome can link the new row back to it.
  trelloCardId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Modal trigger={trigger} title={title} open={open} onOpenChange={onOpenChange}>
      {(close) => {
        async function handleSubmit(formData: FormData) {
          await action(formData);
          close();
        }

        return (
          <IncomeForm
            handleSubmit={handleSubmit}
            defaults={defaults}
            products={products}
            title={title}
            trelloCardId={trelloCardId}
          />
        );
      }}
    </Modal>
  );
}

function IncomeForm({
  handleSubmit,
  defaults,
  products,
  title,
  trelloCardId,
}: {
  handleSubmit: (formData: FormData) => void;
  defaults?: IncomeDefaults;
  products: Product[];
  title: string;
  trelloCardId?: string;
}) {
  const amountRef = useRef<HTMLInputElement | null>(null);

  // Selecting a Товар prefills Сумма from its catalog price — still freely
  // editable afterward, this is just a starting point.
  function onProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const product = products.find((p) => p.id === e.target.value);
    if (product && amountRef.current) {
      amountRef.current.value = String(product.price);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      {trelloCardId && <input type="hidden" name="trelloCardId" value={trelloCardId} />}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Товар" required>
          <select
            name="productId"
            required
            defaultValue={defaults?.productId ?? ""}
            onChange={onProductChange}
            className={inputClass}
          >
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
        <Field label="Дата" required>
          <DateInput name="date" defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Детали продажи">
          <input name="saleDetails" defaultValue={defaults?.saleDetails} className={inputClass} />
        </Field>
        <Field label="Источник" required>
          <select name="source" required defaultValue={defaults?.source ?? ""} className={inputClass}>
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
          <input name="buyer" defaultValue={defaults?.buyer} placeholder="Введите..." className={inputClass} />
        </Field>
        <Field label="Город" required>
          <input name="city" required defaultValue={defaults?.city} placeholder="Введите..." className={inputClass} />
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Field label="Сумма (BYN)" required>
          <input
            ref={amountRef}
            type="number"
            step="0.01"
            name="amount"
            required
            defaultValue={defaults?.amount}
            className={inputClass}
          />
        </Field>
        <Field label="Нал/безнал" required>
          <select name="paymentMethod" required defaultValue={defaults?.paymentMethod ?? ""} className={inputClass}>
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
          <input
            type="number"
            step="0.01"
            name="shipping"
            defaultValue={defaults?.shipping ?? 0}
            className={inputClass}
          />
        </Field>
        <Field label="Доставка">
          <input
            type="number"
            step="0.01"
            name="delivery"
            defaultValue={defaults?.delivery ?? 0}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        <input
          type="checkbox"
          name="taxable"
          defaultChecked={defaults?.taxable ?? true}
          className="size-4 cursor-pointer accent-[var(--accent-orange)]"
        />
        Облагается налогом
      </label>

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110"
      >
        {title}
      </button>
    </form>
  );
}
