export function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex w-fit items-center rounded-md border px-[10px] py-[5px] text-sm font-medium whitespace-nowrap"
      style={{
        color,
        backgroundColor: `${color}33`,
        borderColor: `${color}33`,
      }}
    >
      {label}
    </span>
  );
}
