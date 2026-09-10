"use client";

import { useState } from "react";
import Link from "next/link";
import { moveCardAction, updateCardAction, updateOrderAction, quickAddIncomeAction } from "@/app/(app)/orders/actions";
import { orderDefaultsFromCard, isOrderCard } from "@/lib/trelloParse";
import { EditCardModal } from "./EditCardModal";
import { OrderModal } from "./OrderModal";
import { QuickIncomeModal } from "./QuickIncomeModal";
import { PenIcon, CheckIcon } from "./icons";
import type { TrelloList, TrelloCard } from "@/lib/trello";

const PAGE_SIZE = 30;

type Product = { id: string; name: string; price: number };

export function OrdersBoard({
  lists,
  cardsByList,
  products,
  incomeByCardId,
}: {
  lists: TrelloList[];
  cardsByList: Record<string, TrelloCard[]>;
  products: Product[];
  incomeByCardId: Record<string, string>;
}) {
  const [cards, setCards] = useState(cardsByList);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(lists.map((l) => [l.id, PAGE_SIZE])),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Seeded from the server, then updated in place the moment a quick-add succeeds
  // (see onAdded below) — otherwise the button wouldn't turn into "Доход добавлен"
  // until the next full page load.
  const [incomeLinks, setIncomeLinks] = useState(incomeByCardId);

  function handleDrop(targetListId: string) {
    if (!draggingId) return;
    const cardId = draggingId;
    setDraggingId(null);

    const original = Object.values(cards)
      .flat()
      .find((c) => c.id === cardId);
    if (!original) return;

    const movedCard = { ...original, idList: targetListId };

    setCards((prev) => {
      const next: Record<string, TrelloCard[]> = {};
      for (const [listId, listCards] of Object.entries(prev)) {
        next[listId] = listCards.filter((c) => c.id !== cardId);
      }
      next[targetListId] = [movedCard, ...(next[targetListId] ?? [])];
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
            className="flex max-h-[70vh] w-72 shrink-0 flex-col gap-3 rounded-xl bg-[var(--surface)] p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(list.id)}
          >
            <div className="flex shrink-0 items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{list.name}</h3>
              <span className="text-xs text-[var(--text-inactive)]">{listCards.length}</span>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {visibleCards.map((card) => (
                <OrderCard
                  key={card.id}
                  card={card}
                  products={products}
                  incomeId={incomeLinks[card.id]}
                  onIncomeAdded={(incomeId) => setIncomeLinks((prev) => ({ ...prev, [card.id]: incomeId }))}
                  onDragStart={() => setDraggingId(card.id)}
                />
              ))}
              {listCards.length === 0 && <p className="px-1 text-xs text-[var(--text-inactive)]">Пусто</p>}

              {visibleCount < listCards.length && (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCounts((prev) => ({ ...prev, [list.id]: (prev[list.id] ?? PAGE_SIZE) + PAGE_SIZE }))
                  }
                  className="cursor-pointer px-1 text-left text-xs font-medium text-[var(--accent-blue)] hover:underline"
                >
                  Показать ещё ({listCards.length - visibleCount})
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({
  card,
  products,
  incomeId,
  onIncomeAdded,
  onDragStart,
}: {
  card: TrelloCard;
  products: Product[];
  incomeId: string | undefined;
  onIncomeAdded: (incomeId: string) => void;
  onDragStart: () => void;
}) {
  const structured = isOrderCard(card.desc);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col gap-1 rounded-lg border border-[var(--devider)] bg-[var(--surface-hover)] p-3 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <a
          href={card.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-[var(--text-primary)] hover:underline"
        >
          {card.name}
        </a>
        {structured ? (
          <OrderModal
            title="Изменить заказ"
            submitLabel="Сохранить"
            action={updateOrderAction.bind(null, card.id)}
            products={products}
            defaults={orderDefaultsFromCard(card, products)}
            trigger={
              <button
                type="button"
                aria-label="Изменить заказ"
                className="shrink-0 cursor-pointer text-[var(--text-inactive)] hover:text-[var(--text-primary)]"
              >
                <PenIcon />
              </button>
            }
          />
        ) : (
          <EditCardModal
            card={card}
            action={updateCardAction.bind(null, card.id)}
            trigger={
              <button
                type="button"
                aria-label="Изменить карточку"
                className="shrink-0 cursor-pointer text-[var(--text-inactive)] hover:text-[var(--text-primary)]"
              >
                <PenIcon />
              </button>
            }
          />
        )}
      </div>
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
      {incomeId ? (
        <Link
          href={`/income?open=${incomeId}`}
          className="mt-1 flex w-fit items-center gap-1 text-xs font-medium text-[var(--positive)]"
        >
          <CheckIcon /> Доход добавлен
        </Link>
      ) : (
        <QuickIncomeModal
          action={quickAddIncomeAction.bind(null, { id: card.id, name: card.name, desc: card.desc })}
          onAdded={onIncomeAdded}
          trigger={
            <button
              type="button"
              className="mt-1 w-fit cursor-pointer text-xs font-medium text-[var(--accent-orange)] hover:underline"
            >
              Добавить доход
            </button>
          }
        />
      )}
    </div>
  );
}
