import { prisma } from "@/lib/prisma";
import type { TrelloList, TrelloCard } from "./trello";

export function findDoneList(lists: TrelloList[]): TrelloList | undefined {
  return lists.find((l) => l.name.trim().toLowerCase() === "done");
}

// This app has no history of which cards used to sit in Done before trelloCardId
// existed — every one of those (700+ on the real board) would otherwise look
// "newly done" on the very first reconciliation and try to auto-open that many
// income forms in a row. Only cards active within this window are ever queued;
// older ones stay in Done untouched (their income, if any, was already entered
// by hand). RECENCY_WINDOW_MS also bounds how long a real "moved directly in
// Trello" gap between /orders visits can be before it's missed.
const RECENCY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_PENDING_REVIEW = 15;

// Reconciles Заказы's Done column against linked Income rows — this catches moves made
// either through this app's own drag-and-drop or directly in Trello, since it doesn't
// care which one happened: it just compares "cards in Done right now" against "incomes
// that say they came from a card". Runs on every /orders load (see orders/page.tsx).
export async function reconcileDoneOrders(lists: TrelloList[], cardsByList: Record<string, TrelloCard[]>) {
  const doneList = findDoneList(lists);
  const doneCards = doneList ? (cardsByList[doneList.id] ?? []) : [];
  const doneCardIds = new Set(doneCards.map((c) => c.id));

  const linked = await prisma.income.findMany({
    where: { trelloCardId: { not: null } },
    select: { trelloCardId: true },
  });
  const linkedCardIds = new Set(linked.map((i) => i.trelloCardId as string));

  // Card used to be linked (its income was created while it sat in Done) but isn't in
  // Done anymore — whoever moved it, in Trello or here, the income should go with it.
  const toUnlink = [...linkedCardIds].filter((id) => !doneCardIds.has(id));
  if (toUnlink.length > 0) {
    await prisma.income.deleteMany({ where: { trelloCardId: { in: toUnlink } } });
  }

  // Card is in Done, has no income yet, and was active recently — moved to Done
  // directly in Trello (an in-app drop is handled immediately client-side instead,
  // so it's already linked or about to be by the time this runs). Surfaced to the
  // page as a review queue, capped so a burst can't ever open a wall of modals.
  const cutoff = Date.now() - RECENCY_WINDOW_MS;
  const pendingReview = doneCards
    .filter((c) => !linkedCardIds.has(c.id) && new Date(c.dateLastActivity).getTime() >= cutoff)
    .slice(0, MAX_PENDING_REVIEW);

  return { pendingReview };
}
