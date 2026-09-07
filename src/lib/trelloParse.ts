import { INCOME_SOURCE_LABELS, PAYMENT_METHOD_LABELS, type IncomeSource, type PaymentMethod } from "./types";

const SOURCE_KEYWORDS: [RegExp, IncomeSource][] = [
  [/сайт/i, "SITE"],
  [/инстаграм|instagram/i, "INSTAGRAM"],
  [/реклам/i, "ADS"],
  [/сарафан/i, "WORD_OF_MOUTH"],
  [/магазин/i, "STORE"],
];

function guessSource(title: string): IncomeSource | undefined {
  for (const [re, code] of SOURCE_KEYWORDS) {
    if (re.test(title)) return code;
  }
  return undefined;
}

const KNOWN_LABELS = [
  "Товар",
  "Покупатель",
  "Источник",
  "Город",
  "Сумма",
  "Нал/безнал",
  "Отправка",
  "Доставка",
  "Облагается налогом",
  "Детали продажи",
  "Name",
  "Address",
];

function matchLine(desc: string, label: string): string | undefined {
  const re = new RegExp(`^${label}:\\s*(.+)$`, "im");
  return desc.match(re)?.[1]?.trim() || undefined;
}

function labelToSource(label: string): IncomeSource | undefined {
  const entry = (Object.entries(INCOME_SOURCE_LABELS) as [IncomeSource, string][]).find(
    ([, l]) => l.toLowerCase() === label.toLowerCase(),
  );
  return entry?.[0];
}

function labelToPaymentMethod(label: string): PaymentMethod | undefined {
  const entry = (Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).find(
    ([, l]) => l.toLowerCase() === label.toLowerCase(),
  );
  return entry?.[0];
}

function parseNumber(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const n = Number(text.replace(/[^\d.,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

// Lines that don't match any known "Label: value" line — nothing captured into a
// structured field should ever just disappear, it gets folded into Детали продажи instead.
function unparsedLines(desc: string): string[] {
  return desc
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !KNOWN_LABELS.some((label) => new RegExp(`^${label}:`, "i").test(line)));
}

// True only for cards this app itself created via "Добавить заказ" (see
// buildOrderCardText) — "Облагается налогом:" is the one line always written
// unconditionally, so it's the most reliable signal.
export function isOrderCard(desc: string): boolean {
  return /^Облагается налогом:/im.test(desc);
}

// Two desc "dialects" show up on real cards: the structured Name:/Address: block a lead
// form writes automatically, and the Товар:/Покупатель:/... block this app itself writes
// when a card is created via "Добавить заказ" (see buildOrderCardText below). Free text
// with no labels at all can't be split into fields — it's kept whole in Детали продажи.
function parseStructuredDesc(desc: string) {
  const productName = matchLine(desc, "Товар");
  const buyer = matchLine(desc, "Покупатель") ?? matchLine(desc, "Name");
  const city = matchLine(desc, "Город") ?? matchLine(desc, "Address");
  const sourceLabel = matchLine(desc, "Источник");
  const paymentLabel = matchLine(desc, "Нал/безнал");
  const taxableText = matchLine(desc, "Облагается налогом");

  return {
    productName,
    buyer,
    city,
    source: sourceLabel ? labelToSource(sourceLabel) : undefined,
    amount: parseNumber(matchLine(desc, "Сумма")),
    paymentMethod: paymentLabel ? labelToPaymentMethod(paymentLabel) : undefined,
    shipping: parseNumber(matchLine(desc, "Отправка")),
    delivery: parseNumber(matchLine(desc, "Доставка")),
    taxable: taxableText ? taxableText.toLowerCase().startsWith("д") : undefined,
    saleDetails: matchLine(desc, "Детали продажи"),
  };
}

export function incomeDefaultsFromCard(card: { name: string; desc: string }, products: { id: string; name: string }[] = []) {
  const parsed = parseStructuredDesc(card.desc);
  const leftover = unparsedLines(card.desc).join("; ");
  const product = parsed.productName ? products.find((p) => p.name === parsed.productName) : undefined;

  // Fully structured cards already have every field captured elsewhere, so their
  // own Детали продажи value (if any) is enough. Everything else — lead-form cards,
  // free text — falls back to the title, plus whatever text wasn't recognized above.
  const base = parsed.saleDetails ?? (isOrderCard(card.desc) ? "" : card.name);
  const saleDetails = [base, leftover ? `(${leftover})` : ""].filter(Boolean).join(" ");

  return {
    saleDetails: saleDetails || card.name,
    source: parsed.source ?? guessSource(card.name),
    buyer: parsed.buyer,
    city: parsed.city,
    productId: product?.id,
    amount: parsed.amount,
    paymentMethod: parsed.paymentMethod,
    shipping: parsed.shipping,
    delivery: parsed.delivery,
    taxable: parsed.taxable,
  };
}

// Same field set as incomeDefaultsFromCard, plus the due date — used to pre-fill the
// structured edit form for cards created via "Добавить заказ" (see isOrderCard above).
export function orderDefaultsFromCard(
  card: { name: string; desc: string; due: string | null },
  products: { id: string; name: string }[] = [],
) {
  const parsed = parseStructuredDesc(card.desc);
  const product = parsed.productName ? products.find((p) => p.name === parsed.productName) : undefined;

  return {
    productId: product?.id,
    buyer: parsed.buyer,
    saleDetails: parsed.saleDetails,
    source: parsed.source,
    city: parsed.city,
    amount: parsed.amount,
    paymentMethod: parsed.paymentMethod,
    shipping: parsed.shipping,
    delivery: parsed.delivery,
    taxable: parsed.taxable ?? true,
    due: card.due?.slice(0, 10),
  };
}

// The inverse of parseStructuredDesc — used by "Добавить заказ"/"Изменить заказ" to turn
// the form into a card title + a labeled desc the parsers above can read back losslessly.
export function buildOrderCardText(input: {
  productName?: string;
  buyer?: string;
  source?: IncomeSource;
  city?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
  shipping?: number;
  delivery?: number;
  taxable: boolean;
  saleDetails?: string;
}): { name: string; desc: string } {
  const titleParts = [
    input.productName,
    input.buyer,
    input.city,
    input.source ? INCOME_SOURCE_LABELS[input.source] : undefined,
  ].filter((part): part is string => Boolean(part));
  const name = titleParts.join(". ") || "Новый заказ";

  const descLines = [
    input.productName && `Товар: ${input.productName}`,
    input.buyer && `Покупатель: ${input.buyer}`,
    input.source && `Источник: ${INCOME_SOURCE_LABELS[input.source]}`,
    input.city && `Город: ${input.city}`,
    input.amount != null && `Сумма: ${input.amount} BYN`,
    input.paymentMethod && `Нал/безнал: ${PAYMENT_METHOD_LABELS[input.paymentMethod]}`,
    input.shipping ? `Отправка: ${input.shipping}` : undefined,
    input.delivery ? `Доставка: ${input.delivery}` : undefined,
    `Облагается налогом: ${input.taxable ? "Да" : "Нет"}`,
    input.saleDetails && `Детали продажи: ${input.saleDetails}`,
  ].filter((line): line is string => Boolean(line));

  return { name, desc: descLines.join("\n") };
}
