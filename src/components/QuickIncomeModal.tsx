"use client";

import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/types";
import { Modal } from "./Modal";
import { Field, inputClass, DateInput } from "./form-fields";

// The per-card "Добавить доход" button — deliberately just three fields (Дата,
// Сумма, Нал/безнал). Товар/Покупатель/Город/Источник still get filled in behind
// the scenes from the card's own text (see quickAddIncomeAction), just not shown
// or editable here.
export function QuickIncomeModal({
  trigger,
  action,
  onAdded,
}: {
  trigger: React.ReactNode;
  action: (formData: FormData) => Promise<{ incomeId: string }>;
  onAdded: (incomeId: string) => void;
}) {
  return (
    <Modal trigger={trigger} title="Добавить доход">
      {(close) => {
        async function handleSubmit(formData: FormData) {
          const result = await action(formData);
          onAdded(result.incomeId);
          close();
        }

        return <QuickIncomeForm handleSubmit={handleSubmit} />;
      }}
    </Modal>
  );
}

function QuickIncomeForm({ handleSubmit }: { handleSubmit: (formData: FormData) => void }) {
  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <Field label="Дата дохода" required>
        <DateInput name="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>
      <Field label="Сумма (BYN)" required>
        <input type="number" step="0.01" name="amount" required className={inputClass} />
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

      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-[var(--accent-orange)] text-base font-medium text-white hover:brightness-110"
      >
        Добавить доход
      </button>
    </form>
  );
}
