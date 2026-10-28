"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, INCOME_SOURCES, INCOME_SOURCE_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { Field, inputClass, DateInput } from "./form-fields";

type Product = { id: string; name: string; price: number };

type OrderDefaults = {
  productId?: string;
  buyer?: string;
  saleDetails?: string;
  source?: string;
  city?: string;
  amount?: number;
  paymentMethod?: string;
  shipping?: number;
  delivery?: number;
  due?: string;
};

export function OrderModal({
  trigger,
  title,
  submitLabel,
  action,
  products,
  defaults,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void;
  products: Product[];
  defaults?: OrderDefaults;
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

        return <OrderForm handleSubmit={handleSubmit} products={products} defaults={defaults} submitLabel={submitLabel} />;
      }}
    </Modal>
  );
}

function OrderForm({
  handleSubmit,
  products,
  defaults,
  submitLabel,
}: {
  handleSubmit: (formData: FormData) => void;
  products: Product[];
  defaults?: OrderDefaults;
  submitLabel: string;
}) {
  const amountRef = useRef<HTMLInputElement | null>(null);
  // Identifies this form instance to createOrderAction, which ignores a second
  // submit carrying the same id (ignored by updateOrderAction).
  const [submissionId] = useState(() => crypto.randomUUID());
  // A ref rather than state: a fast double click fires both submits before React
  // has re-rendered, so only something synchronous can stop the second one.
  const submitting = useRef(false);

  async function guardedSubmit(formData: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await handleSubmit(formData);
    } finally {
      submitting.current = false;
    }
  }

  function onProductChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const product = products.find((p) => p.id === e.target.value);
    if (product && amountRef.current) {
      amountRef.current.value = String(product.price);
    }
  }

  return (
    <form action={guardedSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="submissionId" value={submissionId} />
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
        <Field label="Срок выполнения">
          <DateInput name="due" defaultValue={defaults?.due} required={false} />
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
          <input
            name="city"
            required
            defaultValue={defaults?.city}
            placeholder="Введите..."
            className={inputClass}
          />
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
        <Field label="Нал/безнал">
          <select name="paymentMethod" defaultValue={defaults?.paymentMethod ?? ""} className={inputClass}>
            <option value="">Выберите...</option>
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

      <SubmitButton label={submitLabel} />
    </form>
  );
}

// Disabled while the action runs — also blocks Enter-key resubmits, since an
// implicit submit is skipped when the form's default button is disabled.
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Сохраняем..." : label}
    </button>
  );
}
