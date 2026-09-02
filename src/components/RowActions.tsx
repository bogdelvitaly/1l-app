"use client";

import { PenIcon } from "./icons";
import { ConfirmDeleteForm } from "./ConfirmDeleteForm";

export function EditTrigger() {
  return (
    <button type="button" aria-label="Изменить" className="cursor-pointer text-[var(--text-inactive)] hover:text-[var(--text-primary)]">
      <PenIcon />
    </button>
  );
}

export function RowActions({
  id,
  deleteAction,
  editModal,
}: {
  id: string;
  deleteAction: (formData: FormData) => void;
  editModal: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      {editModal}
      <ConfirmDeleteForm action={deleteAction} id={id} ariaLabel="Удалить" className="cursor-pointer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/figma/trash.svg" alt="" width={20} height={20} />
      </ConfirmDeleteForm>
    </div>
  );
}
