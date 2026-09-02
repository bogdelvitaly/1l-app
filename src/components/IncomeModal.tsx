"use client";

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

type Product = { id: string; name: string };

export function IncomeModal({
  trigger,
  title,
  action,
  defaults,
  products,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  defaults?: IncomeDefaults;
  products: Product[];
}) {
  return (
    <Modal trigger={trigger} title={title}>
      {(close) => {
        async function handleSubmit(formData: FormData) {
          await action(formData);
          close();
        }

        return (
          <form action={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Товар">
                <select name="productId" defaultValue={defaults?.productId ?? ""} className={inputClass}>
                  <option value="">Не выбран</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Покупатель">
                <input name="buyer" defaultValue={defaults?.buyer} placeholder="Введите..." className={inputClass} />
              </Field>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Детали продажи">
                <input name="saleDetails" required defaultValue={defaults?.saleDetails} className={inputClass} />
              </Field>
              <Field label="Источник">
                <select name="source" defaultValue={defaults?.source ?? ""} className={inputClass}>
                  <option value="">Не выбран</option>
                  {INCOME_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {INCOME_SOURCE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Дата">
                <DateInput name="date" defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Город">
                <input name="city" defaultValue={defaults?.city} placeholder="Введите..." className={inputClass} />
              </Field>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Сумма (BYN)">
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  required
                  defaultValue={defaults?.amount}
                  className={inputClass}
                />
              </Field>
              <Field label="Нал/безнал">
                <select
                  name="paymentMethod"
                  required
                  defaultValue={defaults?.paymentMethod ?? ""}
                  className={inputClass}
                >
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
      }}
    </Modal>
  );
}
