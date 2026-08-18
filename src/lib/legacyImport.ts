import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { logChange } from "@/lib/changelog";

// Absolute 1-indexed column numbers (A=1, B=2, ...) as laid out in the legacy
// "Расходы {год}" sheets: B=Дата, C=Затраты, D=Сумма(итог, не читаем напрямую),
// E=Налоги, F=Себестоимость, G=ЗП, H=Развитие, I=НЗ(пропускаем), J=Мастерская, K=Отправка.
const EXPENSE_DATE_COL = 2;
const EXPENSE_DESCRIPTION_COL = 3;
const EXPENSE_CATEGORY_COLUMNS: { col: number; category: string }[] = [
  { col: 5, category: "NALOG" },
  { col: 6, category: "SEBESTOIMOST" },
  { col: 7, category: "ZARPLATA" },
  { col: 8, category: "RAZVITIE" },
  // col 9 = "НЗ" — deliberately skipped, not imported (per business decision)
  { col: 10, category: "MASTERSKAYA" },
  { col: 11, category: "OTPRAVKA" },
];

// "Доходы {год}" sheets: B=№ п/п(пропускаем), C=Дата, D=Доход, E=Сумма,
// F=Отправка, G=Доставка, H=Нал/безнал, I=Тип.
const INCOME_DATE_COL = 3;
const INCOME_SALE_DETAILS_COL = 4;
const INCOME_AMOUNT_COL = 5;
const INCOME_SHIPPING_COL = 6;
const INCOME_DELIVERY_COL = 7;
const INCOME_PAYMENT_METHOD_COL = 8;
const INCOME_PRODUCT_TYPE_COL = 9;

const TYPE_CODE_MAP: Record<string, string> = {
  "В-К": "V_K",
  "В-В": "V_V",
  "В-RGB": "V_RGB",
  "ВВ-RGB": "VV_RGB",
  "М-30": "M_30",
  "М-50": "M_50",
  "М-70": "M_70",
};

const PAYMENT_MAP: Record<string, string> = {
  б: "BEZNAL",
  н: "NAL",
};

function excelSerialToDate(serial: number): Date {
  const utcMs = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(utcMs);
}

export function parseLegacyDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number") return excelSerialToDate(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) return excelSerialToDate(Number(trimmed));
    const m = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return new Date(Number(y), Number(mo) - 1, Number(d));
    }
  }
  return null;
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

function cellNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(cellText(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

async function importExpenseSheet(worksheet: ExcelJS.Worksheet, userId: string) {
  let created = 0;
  let skipped = 0;

  for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const values = row.values as unknown[];
    const date = parseLegacyDate(values[EXPENSE_DATE_COL]);
    const description = cellText(values[EXPENSE_DESCRIPTION_COL]);
    if (!date || !description) {
      skipped++;
      continue;
    }

    for (const { col, category } of EXPENSE_CATEGORY_COLUMNS) {
      const amount = cellNumber(values[col]);
      if (amount > 0) {
        const rec = await prisma.expense.create({
          data: { date, description, category, amount, createdById: userId },
        });
        await logChange({ entityType: "Expense", entityId: rec.id, action: "create", diff: { imported: true }, userId });
        created++;
      }
    }
  }

  return { created, skipped };
}

async function importIncomeSheet(worksheet: ExcelJS.Worksheet, userId: string) {
  let created = 0;
  let skipped = 0;

  for (let rowNumber = 3; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const values = row.values as unknown[];
    const date = parseLegacyDate(values[INCOME_DATE_COL]);
    const saleDetails = cellText(values[INCOME_SALE_DETAILS_COL]);
    const amount = cellNumber(values[INCOME_AMOUNT_COL]);
    const rawType = cellText(values[INCOME_PRODUCT_TYPE_COL]);
    const productType = TYPE_CODE_MAP[rawType];

    if (!date || !saleDetails || amount <= 0 || !productType) {
      skipped++;
      continue;
    }

    const shipping = cellNumber(values[INCOME_SHIPPING_COL]);
    const delivery = cellNumber(values[INCOME_DELIVERY_COL]);
    const paymentMethod = PAYMENT_MAP[cellText(values[INCOME_PAYMENT_METHOD_COL])] ?? "BEZNAL";

    const rec = await prisma.income.create({
      data: { date, saleDetails, amount, shipping, delivery, paymentMethod, productType, createdById: userId },
    });
    await logChange({ entityType: "Income", entityId: rec.id, action: "create", diff: { imported: true }, userId });
    created++;
  }

  return { created, skipped };
}

export async function importLegacyWorkbook(workbook: ExcelJS.Workbook, userId: string) {
  const perSheet: { sheet: string; created: number; skipped: number }[] = [];
  let totalExpenses = 0;
  let totalIncomes = 0;
  let totalSkipped = 0;

  for (const worksheet of workbook.worksheets) {
    const name = worksheet.name.trim();
    const expenseMatch = name.match(/^Расходы (\d{4})$/);
    const incomeMatch = name.match(/^Доходы (\d{4})$/);

    if (expenseMatch) {
      const { created, skipped } = await importExpenseSheet(worksheet, userId);
      perSheet.push({ sheet: name, created, skipped });
      totalExpenses += created;
      totalSkipped += skipped;
    } else if (incomeMatch) {
      const { created, skipped } = await importIncomeSheet(worksheet, userId);
      perSheet.push({ sheet: name, created, skipped });
      totalIncomes += created;
      totalSkipped += skipped;
    }
  }

  return { perSheet, totalExpenses, totalIncomes, totalSkipped };
}
