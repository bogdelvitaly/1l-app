"use client";

import { Modal } from "./Modal";
import { Field, inputClass } from "./form-fields";

type ProductType = { id: string; label: string };

type ProductDefaults = {
  name: string;
  price: number;
  color: string;
  productTypeId: string;
};

export function ProductModal({
  trigger,
  title,
  action,
  productTypes,
  defaults,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  productTypes: ProductType[];
  defaults: ProductDefaults;
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
              <Field label="Имя" required>
                <input name="name" required defaultValue={defaults.name} className={inputClass} />
              </Field>
              <Field label="Сумма (BYN)" required>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={defaults.price}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Тип товара" required>
                <select name="productTypeId" required defaultValue={defaults.productTypeId} className={inputClass}>
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Цвет">
                <input
                  name="color"
                  type="color"
                  defaultValue={defaults.color}
                  className="h-10 w-14 cursor-pointer rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] p-1"
                />
              </Field>
            </div>
            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110"
            >
              Сохранить
            </button>
          </form>
        );
      }}
    </Modal>
  );
}
