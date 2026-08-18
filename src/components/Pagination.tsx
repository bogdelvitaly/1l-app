"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasPrev = page > 1;
  const hasNext = to < total;

  function goTo(nextPage: number, nextPageSize = pageSize) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex w-full items-center justify-between">
      <p className="text-xs text-[var(--text-primary)]">
        {from} - {to} of {total}
      </p>
      <div className="flex items-center gap-[59px]">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)]">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => goTo(1, Number(e.target.value))}
            className="rounded border border-[var(--devider)] bg-[var(--surface)] px-2 py-1.5 text-[10px] text-[var(--text-primary)] focus:outline-none"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-[7px]">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={() => goTo(page - 1)}
            className="rounded border border-[var(--devider)] bg-[var(--surface)] p-1.5 text-[var(--text-primary)] disabled:opacity-50"
          >
            <ArrowLeftIcon />
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => goTo(page + 1)}
            className="rounded border border-[var(--devider)] bg-[var(--surface)] p-1.5 text-[var(--text-primary)] disabled:opacity-50"
          >
            <ArrowRightIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
