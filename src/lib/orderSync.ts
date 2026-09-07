import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveProductType } from "@/app/(app)/income/actions";
import { incomeDefaultsFromCard } from "./trelloParse";
import type { TrelloList, TrelloCard } from "./trello";

export function findDoneList(lists: TrelloList[]): TrelloList | undefined {
  return lists.find((l) => l.name.trim().toLowerCase() === "done");
}

// This app has no history of which cards used to sit in Done before trelloCardId
// existed — every one of those (700+ on the real board) would otherwise look
// "newly done" on the very first reconciliation and try to auto-create that many
// income rows in a row. Only cards active within this window are ever auto-created;
// older ones stay in Done untouched (their income, if any, was already entered
// by hand). RECENCY_WINDOW_MS also bounds how long a real "moved directly in
// Trello" gap between /orders visits can be before it's missed.
const RECENCY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_AUTO_CREATE = 15;

// Turns a Done card into an Income row using whatever incomeDefaultsFromCard could
// read off its title/description (see trelloParse.ts). Amount and Нал/безнал are
// required by the schema but aren't always present on free-text cards — when
// missing, the row is still created (amount 0, Нал default) but flagged in Детали
// продажи so it stands out in the Доходы table for a manual fix.
export async function createIncomeFromCard(
  card: { id: string; name: string; desc: string },
  products: { id: string; name: string }[],
  createdById: string,
) {
  const defaults = incomeDefaultsFromCard(card, products);
  const productType = defaults.productId ? await resolveProductType(defaults.productId) : null;
  const needsAmountReview = defaults.amount == null;
  const saleDetails = needsAmountReview ? `⚠ Проверить сумму — ${defaults.saleDetails}` : defaults.saleDetails;

  await prisma.income.create({
    data: {
      date: new Date(),
      saleDetails,
      amount: defaults.amount ?? 0,
      shipping: defaults.shipping ?? 0,
      delivery: defaults.delivery ?? 0,
      paymentMethod: defaults.paymentMethod ?? "NAL",
      productType,
      productId: defaults.productId,
      buyer: defaults.buyer,
      city: defaults.city,
      source: defaults.source,
      taxable: defaults.taxable ?? true,
      trelloCardId: card.id,
      createdById,
    },
  });
}

// Reconciles Заказы's Done column against linked Income rows — this catches moves made
// either through this app's own drag-and-drop (handled immediately, see
// addIncomeForCardAction in orders/actions.ts) or directly in Trello, which this only
// finds out about on the next /orders load. Runs on every /orders load (see orders/page.tsx).
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
  // directly in Trello (an in-app drop already created its income immediately, so
  // it's already linked by the time this runs). Windowed + capped so a burst can
  // never auto-create a wall of income rows from the historical backlog.
  const cutoff = Date.now() - RECENCY_WINDOW_MS;
  const toCreate = doneCards
    .filter((c) => !linkedCardIds.has(c.id) && new Date(c.dateLastActivity).getTime() >= cutoff)
    .slice(0, MAX_AUTO_CREATE);

  if (toCreate.length > 0) {
    const session = await auth();
    if (session?.user) {
      const products = await prisma.product.findMany();
      for (const card of toCreate) {
        // A card can only be missing its income by racing with another reconciliation
        // or the in-app immediate create — skip rather than fail the whole page load.
        await createIncomeFromCard(card, products, session.user.id).catch(() => {});
      }
    }
  }
}
