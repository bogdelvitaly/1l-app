"use client";

import { useRef, useState } from "react";

// Drop-in replacement for `<form action={deleteX}><input type="hidden" name="id" .../><button type="submit">...
// The trigger button stays visually identical (children/className/ariaLabel are passed through) but no longer
// submits directly — it opens a confirmation popup first, and the hidden form only submits on explicit confirm.
export function ConfirmDeleteForm({
  action,
  id,
  className,
  ariaLabel,
  children,
}: {
  action: (formData: FormData) => void;
  id: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <form ref={formRef} action={action}>
        <input type="hidden" name="id" value={id} />
        <button type="button" aria-label={ariaLabel} className={className} onClick={() => setOpen(true)}>
          {children}
        </button>
      </form>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[380px] rounded-xl border border-[var(--devider)] bg-[var(--surface)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-medium text-[var(--text-primary)]">Вы уверены, что хотите удалить?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 cursor-pointer rounded-lg px-4 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  formRef.current?.requestSubmit();
                }}
                className="h-10 cursor-pointer rounded-lg bg-[var(--negative)] px-5 text-sm font-medium text-white hover:brightness-110"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
