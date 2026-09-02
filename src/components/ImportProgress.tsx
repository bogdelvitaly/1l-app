"use client";

import { useFormStatus } from "react-dom";

// Both read pending state from the nearest ancestor <form> — they must be
// rendered inside the import <form>, even though the overlay is visually
// full-screen via fixed positioning.
export function ImportSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-10 shrink-0 rounded-lg bg-[var(--accent-orange)] px-5 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Загрузка..." : "Загрузить файл"}
    </button>
  );
}

export function ImportOverlay() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="flex w-full max-w-[380px] flex-col items-center gap-4 rounded-xl border border-[var(--devider)] bg-[var(--surface)] p-8 text-center">
        <div className="size-10 animate-spin rounded-full border-4 border-[var(--devider)] border-t-[var(--accent-orange)]" />
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">Загрузка данных...</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Старые доходы и расходы заменяются новыми — не закрывайте страницу.
          </p>
        </div>
      </div>
    </div>
  );
}
