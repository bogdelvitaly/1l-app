"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveTrelloCard, createTrelloCard, updateTrelloCard, getIntakeListId, getTrelloCardName } from "@/lib/trello";
import { buildOrderCardText, extractOrderNumber, incomeDefaultsFromCard } from "@/lib/trelloParse";
import { resolveProductType } from "@/app/(app)/income/actions";
import { INCOME_SOURCES, PAYMENT_METHODS, type IncomeSource, type PaymentMethod } from "@/lib/types";

export async function moveCardAction(cardId: string, listId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await moveTrelloCard(cardId, listId);
  revalidatePath("/orders");
}

// Behind the "Добавить доход" button on a card — a deliberate, one-at-a-time action,
// so unlike the old Done-triggered auto-create this only ever touches the one card
// clicked. Товар/Покупатель/Город/Источник are still inferred from the card's own
// text (see incomeDefaultsFromCard); only Дата/Сумма/Нал-безнал come from the form.
export async function quickAddIncomeAction(
  card: { id: string; name: string; desc: string },
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const products = await prisma.product.findMany();
  const defaults = incomeDefaultsFromCard(card, products);
  const productType = defaults.productId ? await resolveProductType(defaults.productId) : null;

  const dateRaw = String(formData.get("date") || "");
  const date = dateRaw ? new Date(dateRaw) : new Date();
  const amount = Number(formData.get("amount") || 0);
  const paymentMethod = String(formData.get("paymentMethod") || "");

  const income = await prisma.income.create({
    data: {
      date,
      saleDetails: defaults.saleDetails,
      amount,
      shipping: defaults.shipping ?? 0,
      delivery: defaults.delivery ?? 0,
      paymentMethod,
      productType,
      productId: defaults.productId,
      buyer: defaults.buyer,
      city: defaults.city,
      source: defaults.source,
      taxable: defaults.taxable ?? true,
      trelloCardId: card.id,
      createdById: session.user.id,
    },
  });

  revalidatePath("/income");
  revalidatePath("/orders");
  return { incomeId: income.id };
}

// Behind the "MMYY/N" order number on every card created via "Добавить заказ" —
// not exposed on the form, just embedded in the title (see buildOrderCardText).
// The Postgres upsert below is a single atomic statement, so concurrent creates
// in the same month still each get a distinct counter value.
async function nextOrderNumber(date = new Date()): Promise<string> {
  const monthKey = `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getFullYear()).slice(-2)}`;
  const seq = await prisma.orderSequence.upsert({
    where: { monthKey },
    update: { counter: { increment: 1 } },
    create: { monthKey, counter: 1 },
  });
  return `${monthKey}/${seq.counter}`;
}

async function buildOrderCardFromForm(formData: FormData, orderNumber: string | undefined) {
  const productId = String(formData.get("productId") || "");
  const buyer = String(formData.get("buyer") || "") || undefined;
  const saleDetails = String(formData.get("saleDetails") || "") || undefined;
  const city = String(formData.get("city") || "") || undefined;
  const due = String(formData.get("due") || "") || null;
  // Not exposed on the "Добавить заказ" form anymore — orders are always taxable
  // by default. Доходы's own checkbox (still editable there) is what actually
  // feeds the tax report once the order reaches Done.
  const taxable = true;

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
    orderNumber,
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

  const orderNumber = await nextOrderNumber();
  const { name, desc, due } = await buildOrderCardFromForm(formData, orderNumber);
  const idList = await getIntakeListId();
  await createTrelloCard({ idList, name, desc, due });

  revalidatePath("/orders");
}

// Only used for cards created via "Добавить заказ" (see isOrderCard in trelloParse) —
// re-derives the card's title/desc from the structured form, same as create. Reads
// the card's current title first so its order number (not on the form) survives.
export async function updateOrderAction(cardId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentName = await getTrelloCardName(cardId);
  const orderNumber = extractOrderNumber(currentName);
  const { name, desc, due } = await buildOrderCardFromForm(formData, orderNumber);
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
