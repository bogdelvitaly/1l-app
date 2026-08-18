import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";

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

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `1L-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
