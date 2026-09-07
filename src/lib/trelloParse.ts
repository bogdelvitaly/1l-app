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

// Two desc "dialects" show up on real cards: the structured Name:/Address: block a lead
// form writes automatically, and the Товар:/Покупатель:/... block this app itself writes
// when a card is created via "Добавить заказ" (see buildOrderCardText below). Free text
// with no labels at all is too unreliable to parse — left blank for the person to fill in.
function parseStructuredDesc(desc: string) {
  const productName = matchLine(desc, "Товар");
  const buyer = matchLine(desc, "Покупатель") ?? matchLine(desc, "Name");
  const city = matchLine(desc, "Город") ?? matchLine(desc, "Address");
  const sourceLabel = matchLine(desc, "Источник");
  const amountText = matchLine(desc, "Сумма");
  const paymentLabel = matchLine(desc, "Нал/безнал");
  const saleDetails = matchLine(desc, "Детали продажи");

  return {
    productName,
    buyer,
    city,
    source: sourceLabel ? labelToSource(sourceLabel) : undefined,
    amount: amountText ? Number(amountText.replace(/[^\d.,]/g, "").replace(",", ".")) || undefined : undefined,
    paymentMethod: paymentLabel ? labelToPaymentMethod(paymentLabel) : undefined,
    saleDetails,
  };
}

export function incomeDefaultsFromCard(card: { name: string; desc: string }, products: { id: string; name: string }[] = []) {
  const parsed = parseStructuredDesc(card.desc);
  const product = parsed.productName ? products.find((p) => p.name === parsed.productName) : undefined;

  return {
    saleDetails: parsed.saleDetails ?? card.name,
    source: parsed.source ?? guessSource(card.name),
    buyer: parsed.buyer,
    city: parsed.city,
    productId: product?.id,
    amount: parsed.amount,
    paymentMethod: parsed.paymentMethod,
  };
}

// The inverse of incomeDefaultsFromCard — used by "Добавить заказ" to turn the form
// into a card title + a labeled desc that the parser above can read back losslessly.
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
