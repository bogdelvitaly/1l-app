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
  productId?: string;
  buyer?: string;
  city?: string;
  taxable?: boolean;
};

// productTypeCode (not productTypeId!) — the Тип товара <select>'s options are
// keyed by ProductType.code (e.g. "V_K"), same as Income.productType itself.
type Product = { id: string; name: string; productTypeCode: string };

export function IncomeModal({
  trigger,
  title,
  action,
  defaults,
  productTypes,
  products,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  defaults?: IncomeDefaults;
  productTypes: { code: string; label: string }[];
  products: Product[];
}) {
  return (
    <Modal trigger={trigger} title={title}>
      {(close) => {
        async function handleSubmit(formData: FormData) {
          await action(formData);
          close();
        }

        // Selecting a Товар implies its Тип товара — kept as a plain DOM write
        // (not React state) since the rest of this form is uncontrolled too.
        const productTypeRef = { current: null as HTMLSelectElement | null };
        const onProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          const product = products.find((p) => p.id === e.target.value);
          if (product && productTypeRef.current) {
            productTypeRef.current.value = product.productTypeCode;
          }
        };

        return (
          <form action={handleSubmit} className="flex flex-col gap-6">
            <Field label="Детали продажи">
              <input name="saleDetails" required defaultValue={defaults?.saleDetails} className={inputClass} />
            </Field>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Товар">
                <select
                  name="productId"
                  defaultValue={defaults?.productId ?? ""}
                  onChange={onProductChange}
                  className={inputClass}
                >
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
              <Field label="Дата">
                <DateInput name="date" defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Тип товара">
                <TypeSelect
                  productTypes={productTypes}
                  defaultValue={
                    defaults?.productType ?? products.find((p) => p.id === defaults?.productId)?.productTypeCode ?? ""
                  }
                  selectRef={productTypeRef}
                />
              </Field>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Город">
                <input name="city" defaultValue={defaults?.city} placeholder="Введите..." className={inputClass} />
              </Field>
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
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
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
              <Field label="Отправка">
                <input
                  type="number"
                  step="0.01"
                  name="shipping"
                  defaultValue={defaults?.shipping ?? 0}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Доставка">
              <input
                type="number"
                step="0.01"
                name="delivery"
                defaultValue={defaults?.delivery ?? 0}
                className={inputClass}
              />
            </Field>

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

function TypeSelect({
  productTypes,
  defaultValue,
  selectRef,
}: {
  productTypes: { code: string; label: string }[];
  defaultValue: string;
  selectRef: { current: HTMLSelectElement | null };
}) {
  return (
    <select
      name="productType"
      required
      defaultValue={defaultValue}
      ref={(el) => {
        selectRef.current = el;
      }}
      className={inputClass}
    >
      <option value="" disabled>
        Выберите...
      </option>
      {productTypes.map((pt) => (
        <option key={pt.code} value={pt.code}>
          {pt.label}
        </option>
      ))}
    </select>
  );
}
