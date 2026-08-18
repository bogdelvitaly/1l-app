import { CalendarIcon } from "./icons";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-2 text-xs text-[var(--text-inactive)]">
      {label}
      {children}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-md border border-[var(--devider)] bg-[var(--surface-hover)] px-4 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-inactive)] focus:outline-none focus:border-[var(--accent-blue)]";

// Native <input type="date"> with the browser's own calendar-picker icon swapped
// for one matching the rest of the icon set (see globals.css for the rule that
// hides the native icon while keeping it clickable, so opening the picker still
// works everywhere on the input).
export function DateInput({
  name,
  defaultValue,
  className,
}: {
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        type="date"
        name={name}
        required
        defaultValue={defaultValue}
        className={`${inputClass} pr-10 ${className ?? ""}`}
      />
      <CalendarIcon className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--text-inactive)]" />
    </div>
  );
}
