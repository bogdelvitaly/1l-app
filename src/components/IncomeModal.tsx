"use client";

import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { DateInput, Field, inputClass } from "./form-fields";

type IncomeDefaults = {
  date?: string;
  saleDetails?: string;
  amount?: number;
  shipping?: number;
  delivery?: number;
  paymentMethod?: string;
  productType?: string;
};

export function IncomeModal({
  trigger,
  title,
  action,
  defaults,
  productTypes,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  defaults?: IncomeDefaults;
  productTypes: { code: string; label: string }[];
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
            <Field label="Детали продажи">
              <input name="saleDetails" required defaultValue={defaults?.saleDetails} className={inputClass} />
            </Field>

            <div className="flex gap-4">
              <Field label="Дата">
                <DateInput name="date" defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Тип товара">
                <select name="productType" required defaultValue={defaults?.productType ?? ""} className={inputClass}>
                  <option value="" disabled>
                    Выберите...
                  </option>
                  {productTypes.map((pt) => (
                    <option key={pt.code} value={pt.code}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex gap-4">
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

            <div className="flex gap-4">
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
