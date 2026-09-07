"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "./icons";

export function Modal({
  trigger,
  title,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
  // Uncontrolled by default (own internal open state, toggled by clicking `trigger`).
  // Pass both to drive it externally instead — e.g. auto-opening it in response to
  // some other action, with no trigger element of its own.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) onOpenChange?.(value);
    else setInternalOpen(value);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {trigger && <span onClick={() => setOpen(true)}>{trigger}</span>}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-full flex-col overflow-y-auto border-[var(--devider)] bg-[var(--surface)] p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-[574px] sm:rounded-xl sm:border sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 flex items-start justify-between">
              <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <CloseIcon className="rotate-45 text-[var(--text-primary)]" />
              </button>
            </div>
            {children(() => setOpen(false))}
          </div>
        </div>
      )}
    </>
  );
}
