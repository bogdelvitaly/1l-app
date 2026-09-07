"use client";

import { useState } from "react";
import { moveCardAction } from "@/app/(app)/orders/actions";
import { createIncome } from "@/app/(app)/income/actions";
import { incomeDefaultsFromCard } from "@/lib/trelloParse";
import { IncomeModal } from "./IncomeModal";
import type { TrelloList, TrelloCard } from "@/lib/trello";

const PAGE_SIZE = 30;

type Product = { id: string; name: string; price: number };

export function OrdersBoard({
  lists,
  cardsByList,
  products,
}: {
  lists: TrelloList[];
  cardsByList: Record<string, TrelloCard[]>;
  products: Product[];
}) {
  const [cards, setCards] = useState(cardsByList);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(lists.map((l) => [l.id, PAGE_SIZE])),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(targetListId: string) {
    if (!draggingId) return;
    const cardId = draggingId;
    setDraggingId(null);

    setCards((prev) => {
      let moved: TrelloCard | undefined;
      const next: Record<string, TrelloCard[]> = {};
      for (const [listId, listCards] of Object.entries(prev)) {
        next[listId] = listCards.filter((c) => {
          if (c.id === cardId) {
            moved = c;
            return false;
          }
          return true;
        });
      }
      if (moved && moved.idList !== targetListId) {
        next[targetListId] = [{ ...moved, idList: targetListId }, ...(next[targetListId] ?? [])];
      } else if (moved) {
        next[targetListId] = [moved, ...(next[targetListId] ?? [])];
      }
      return next;
    });

    moveCardAction(cardId, targetListId).catch(() => {
      // Best-effort optimistic update — a failed write just means the next tab
      // open (live refetch) will show the real Trello state again.
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-4 sm:px-8 sm:pb-8">
      {lists.map((list) => {
        const listCards = cards[list.id] ?? [];
        const visibleCount = visibleCounts[list.id] ?? PAGE_SIZE;
        const visibleCards = listCards.slice(0, visibleCount);

        return (
          <div
            key={list.id}
            className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-[var(--surface)] p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(list.id)}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{list.name}</h3>
              <span className="text-xs text-[var(--text-inactive)]">{listCards.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {visibleCards.map((card) => (
                <OrderCard key={card.id} card={card} products={products} onDragStart={() => setDraggingId(card.id)} />
              ))}
              {listCards.length === 0 && <p className="px-1 text-xs text-[var(--text-inactive)]">Пусто</p>}
            </div>

            {visibleCount < listCards.length && (
              <button
                type="button"
                onClick={() => setVisibleCounts((prev) => ({ ...prev, [list.id]: (prev[list.id] ?? PAGE_SIZE) + PAGE_SIZE }))}
                className="cursor-pointer px-1 text-left text-xs font-medium text-[var(--accent-blue)] hover:underline"
              >
                Показать ещё ({listCards.length - visibleCount})
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  card,
  products,
  onDragStart,
}: {
  card: TrelloCard;
  products: Product[];
  onDragStart: () => void;
}) {
  const defaults = incomeDefaultsFromCard(card);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col gap-1 rounded-lg border border-[var(--devider)] bg-[var(--surface-hover)] p-3 active:cursor-grabbing"
    >
      <a
        href={card.shortUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-[var(--text-primary)] hover:underline"
      >
        {card.name}
      </a>
      {card.due && (
        <p className={`text-xs ${!card.dueComplete && new Date(card.due) < new Date() ? "text-[var(--negative)]" : "text-[var(--text-inactive)]"}`}>
          до {new Date(card.due).toLocaleDateString("ru-RU")}
        </p>
      )}
      {card.desc && (
        <p className="truncate text-xs text-[var(--text-muted)]" title={card.desc}>
          {card.desc}
        </p>
      )}
      <IncomeModal
        title="Добавить доход"
        action={createIncome}
        products={products}
        defaults={defaults}
        trigger={
          <button
            type="button"
            className="mt-1 w-fit cursor-pointer text-xs font-medium text-[var(--accent-orange)] hover:underline"
          >
            Добавить доход
          </button>
        }
      />
    </div>
  );
}
