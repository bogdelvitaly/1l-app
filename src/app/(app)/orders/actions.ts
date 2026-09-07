"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveTrelloCard, createTrelloCard, updateTrelloCard, getIntakeListId } from "@/lib/trello";
import { buildOrderCardText } from "@/lib/trelloParse";
import { createIncomeFromCard } from "@/lib/orderSync";
import { INCOME_SOURCES, PAYMENT_METHODS, type IncomeSource, type PaymentMethod } from "@/lib/types";

export async function moveCardAction(cardId: string, listId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await moveTrelloCard(cardId, listId);
  revalidatePath("/orders");
}

// Called immediately when a card is dragged into Done in-app, so the Доходы row
// appears right away instead of waiting for the next /orders load's reconciliation
// (see reconcileDoneOrders in src/lib/orderSync.ts, which still catches cards moved
// directly in Trello).
export async function addIncomeForCardAction(card: { id: string; name: string; desc: string }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const products = await prisma.product.findMany();
  await createIncomeFromCard(card, products, session.user.id);
  revalidatePath("/income");
  revalidatePath("/orders");
}

// Called immediately when a card is dragged out of Done in-app, for instant feedback —
// reconcileDoneOrders (src/lib/orderSync.ts) would catch this on the next /orders load
// regardless, including for cards moved directly in Trello.
export async function removeIncomeForCardAction(cardId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.income.deleteMany({ where: { trelloCardId: cardId } });
  revalidatePath("/income");
  revalidatePath("/orders");
}

async function buildOrderCardFromForm(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const buyer = String(formData.get("buyer") || "") || undefined;
  const saleDetails = String(formData.get("saleDetails") || "") || undefined;
  const city = String(formData.get("city") || "") || undefined;
  const due = String(formData.get("due") || "") || null;
  const taxable = formData.has("taxable");

  const sourceRaw = String(formData.get("source") || "");
  const source = (INCOME_SOURCES as readonly string[]).includes(sourceRaw) ? (sourceRaw as IncomeSource) : undefined;

  const paymentRaw = String(formData.get("paymentMethod") || "");
  const paymentMethod = (PAYMENT_METHODS as readonly string[]).includes(paymentRaw)
    ? (paymentRaw as PaymentMethod)
    : undefined;

  const amountRaw = formData.get("amount");
  const amount = amountRaw ? Number(amountRaw) : undefined;
  const shipping = Number(formData.get("shipping") || 0) || undefined;
  const delivery = Number(formData.get("delivery") || 0) || undefined;

  const product = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;

  const { name, desc } = buildOrderCardText({
    productName: product?.name,
    buyer,
    source,
    city,
    amount,
    paymentMethod,
    shipping,
    delivery,
    taxable,
    saleDetails,
  });

  return { name, desc, due };
}

export async function createOrderAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const { name, desc, due } = await buildOrderCardFromForm(formData);
  const idList = await getIntakeListId();
  await createTrelloCard({ idList, name, desc, due });

  revalidatePath("/orders");
}

// Only used for cards created via "Добавить заказ" (see isOrderCard in trelloParse) —
// re-derives the card's title/desc from the structured form, same as create.
export async function updateOrderAction(cardId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const { name, desc, due } = await buildOrderCardFromForm(formData);
  await updateTrelloCard(cardId, { name, desc, due });

  revalidatePath("/orders");
}

export async function updateCardAction(cardId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Название не может быть пустым");
  const desc = String(formData.get("desc") || "");
  const due = String(formData.get("due") || "") || null;

  await updateTrelloCard(cardId, { name, desc, due });
  revalidatePath("/orders");
}
