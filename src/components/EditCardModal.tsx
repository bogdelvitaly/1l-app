"use client";

import { Modal } from "./Modal";
import { Field, inputClass, DateInput } from "./form-fields";
import type { TrelloCard } from "@/lib/trello";

export function EditCardModal({
  trigger,
  card,
  action,
}: {
  trigger: React.ReactNode;
  card: TrelloCard;
  action: (formData: FormData) => void;
}) {
  return (
    <Modal trigger={trigger} title="Изменить карточку">
      {(close) => {
        async function handleSubmit(formData: FormData) {
          await action(formData);
          close();
        }

        return (
          <form action={handleSubmit} className="flex flex-col gap-6">
            <Field label="Название" required>
              <input name="name" required defaultValue={card.name} className={inputClass} />
            </Field>

            <Field label="Описание">
              <textarea
                name="desc"
                rows={6}
                defaultValue={card.desc}
                className={`${inputClass} h-auto resize-y py-2`}
              />
            </Field>

            <Field label="Срок выполнения">
              <DateInput name="due" defaultValue={card.due?.slice(0, 10) ?? ""} required={false} />
            </Field>

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
