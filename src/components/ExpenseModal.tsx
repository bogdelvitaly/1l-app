"use client";

import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { DateInput, Field, inputClass } from "./form-fields";

type ExpenseDefaults = {
  date?: string;
  description?: string;
  category?: string;
  amount?: number;
};

export function ExpenseModal({
  trigger,
  title,
  action,
  defaults,
}: {
  trigger: React.ReactNode;
  title: string;
  action: (formData: FormData) => void;
  defaults?: ExpenseDefaults;
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
            <Field label="Описание">
              <input name="description" required defaultValue={defaults?.description} className={inputClass} />
            </Field>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Field label="Дата">
                <DateInput name="date" defaultValue={defaults?.date ?? new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Тип затрат">
                <select name="category" required defaultValue={defaults?.category ?? ""} className={inputClass}>
                  <option value="" disabled>
                    Выберите...
                  </option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

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
