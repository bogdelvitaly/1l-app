import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { getQuarterlyReport } from "@/lib/reports";
import { quarterOfMonth } from "@/lib/formulas";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [expenses, incomes, productTypes] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
    prisma.income.findMany({ orderBy: { date: "asc" } }),
    prisma.productType.findMany(),
  ]);

  const typeLabel = new Map(productTypes.map((pt) => [pt.code, pt.label]));

  const years = Array.from(
    new Set([...expenses.map((e) => e.date.getFullYear()), ...incomes.map((i) => i.date.getFullYear())]),
  ).sort();

  const workbook = new ExcelJS.Workbook();

  for (const year of years) {
    const expenseSheet = workbook.addWorksheet(`Расходы ${year}`);
    expenseSheet.columns = [
      { header: "Дата", key: "date", width: 12 },
      { header: "Затраты", key: "description", width: 40 },
      { header: "Сумма", key: "amount", width: 12 },
      { header: "Налоги", key: "NALOG", width: 12 },
      { header: "Себестоимость", key: "SEBESTOIMOST", width: 14 },
      { header: "Заработная плата", key: "ZARPLATA", width: 16 },
      { header: "Развитие", key: "RAZVITIE", width: 12 },
      { header: "Мастерская", key: "MASTERSKAYA", width: 12 },
      { header: "Отправка", key: "OTPRAVKA", width: 12 },
    ];
    for (const e of expenses.filter((e) => e.date.getFullYear() === year)) {
      expenseSheet.addRow({
        date: e.date.toLocaleDateString("ru-RU"),
        description: e.description,
        amount: e.amount,
        [e.category]: e.amount,
      });
    }

    const incomeSheet = workbook.addWorksheet(`Доходы ${year}`);
    incomeSheet.columns = [
      { header: "№ п/п", key: "seq", width: 8 },
      { header: "Дата", key: "date", width: 12 },
      { header: "Доход", key: "saleDetails", width: 40 },
      { header: "Сумма", key: "amount", width: 12 },
      { header: "Отправка", key: "shipping", width: 12 },
      { header: "Доставка", key: "delivery", width: 12 },
      { header: "Нал/безнал", key: "paymentMethod", width: 12 },
      { header: "Тип", key: "productType", width: 30 },
    ];
    const yearIncomes = incomes.filter((i) => i.date.getFullYear() === year);
    yearIncomes.forEach((i, idx) => {
      incomeSheet.addRow({
        seq: idx + 1,
        date: i.date.toLocaleDateString("ru-RU"),
        saleDetails: i.saleDetails,
        amount: i.amount,
        shipping: i.shipping,
        delivery: i.delivery,
        paymentMethod: PAYMENT_METHOD_LABELS[i.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? i.paymentMethod,
        productType: typeLabel.get(i.productType) ?? i.productType,
      });
    });
  }

  if (years.length === 0) {
    workbook.addWorksheet("Расходы");
    workbook.addWorksheet("Доходы");
  }

  // Один ряд на каждый квартал, за который есть хоть один доход или расход.
  const quartersPresent = new Set<string>();
  for (const i of incomes) quartersPresent.add(`${i.date.getFullYear()}-${quarterOfMonth(i.date.getMonth() + 1)}`);
  for (const e of expenses) quartersPresent.add(`${e.date.getFullYear()}-${quarterOfMonth(e.date.getMonth() + 1)}`);

  if (quartersPresent.size > 0) {
    const quarterSheet = workbook.addWorksheet("Отчёты по кварталам");
    quarterSheet.columns = [
      { header: "Год", key: "year", width: 10 },
      { header: "Квартал", key: "quarter", width: 10 },
      { header: "Брутто", key: "brutto", width: 14 },
      { header: "Себестоимость", key: "cost", width: 16 },
      { header: "Аренда мастерской", key: "masterskaya", width: 18 },
      { header: "Развитие по факту", key: "razvitie", width: 18 },
      { header: "Пересылка", key: "peresylka", width: 14 },
      { header: "Налог", key: "tax", width: 14 },
      { header: "Остаток", key: "ostatok", width: 14 },
    ];

    const sortedQuarters = Array.from(quartersPresent)
      .map((key) => {
        const [year, quarter] = key.split("-").map(Number);
        return { year, quarter: quarter as 1 | 2 | 3 | 4 };
      })
      .sort((a, b) => a.year - b.year || a.quarter - b.quarter);

    for (const { year, quarter } of sortedQuarters) {
      const report = await getQuarterlyReport(year, quarter);
      quarterSheet.addRow({
        year,
        quarter: `Q${quarter}`,
        brutto: report.brutto,
        cost: report.totalCost,
        masterskaya: report.masterskaya,
        razvitie: report.razvitieFakt,
        peresylka: report.peresylka,
        tax: report.quarterTax,
        ostatok: report.ostatok,
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `1L-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
