import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { getQuarterlyReport } from "@/lib/reports";
import { quarterOfMonth } from "@/lib/formulas";

const DATE_FMT = "dd.mm.yyyy";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [expenses, incomes, productTypes, products] = await Promise.all([
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
    prisma.income.findMany({ orderBy: { date: "asc" } }),
    prisma.productType.findMany({ include: { components: true }, orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ include: { productType: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const typeLabel = new Map(productTypes.map((pt) => [pt.code, pt.label]));
  const typeCost = new Map(productTypes.map((pt) => [pt.code, pt.components.reduce((sum, c) => sum + c.price, 0)]));

  const years = Array.from(
    new Set([...expenses.map((e) => e.date.getFullYear()), ...incomes.map((i) => i.date.getFullYear())]),
  ).sort();

  const workbook = new ExcelJS.Workbook();

  // --- Компоненты себестоимости + Типы товаров — «Себестоимость» в Типах товаров
  // складывается формулой из строк этой вкладки, а не записывается числом.
  const componentsSheet = workbook.addWorksheet("Компоненты себестоимости");
  componentsSheet.columns = [
    { header: "Код типа", key: "code", width: 14 },
    { header: "Тип товара", key: "typeLabel", width: 30 },
    { header: "Компонент", key: "name", width: 24 },
    { header: "Цена", key: "price", width: 12 },
  ];
  for (const pt of productTypes) {
    for (const c of pt.components) {
      componentsSheet.addRow({ code: pt.code, typeLabel: pt.label, name: c.name, price: c.price });
    }
  }

  const typesSheet = workbook.addWorksheet("Типы товаров");
  typesSheet.columns = [
    { header: "Код", key: "code", width: 14 },
    { header: "Название", key: "label", width: 32 },
    { header: "Себестоимость", key: "cost", width: 16 },
  ];
  for (const pt of productTypes) {
    const rowNum = typesSheet.rowCount + 1;
    typesSheet.addRow({
      code: pt.code,
      label: pt.label,
      cost: {
        formula: `SUMIF('Компоненты себестоимости'!A:A,A${rowNum},'Компоненты себестоимости'!D:D)`,
        result: typeCost.get(pt.code) ?? 0,
      },
    });
  }

  // --- Товары — справочный каталог, ничего сюда не выводится формулой.
  const productsSheet = workbook.addWorksheet("Товары");
  productsSheet.columns = [
    { header: "Имя", key: "name", width: 24 },
    { header: "Тип товара", key: "type", width: 32 },
    { header: "Цена", key: "price", width: 12 },
  ];
  for (const p of products) {
    productsSheet.addRow({ name: p.name, type: p.productType.label, price: p.price });
  }

  // --- Расходы/Доходы по годам. Даты пишутся как настоящие Excel-даты (не текст),
  // иначе межлистовые формулы по датам ниже не смогут их сравнивать.
  for (const year of years) {
    const expenseSheet = workbook.addWorksheet(`Расходы ${year}`);
    expenseSheet.columns = [
      { header: "Дата", key: "date", width: 12, style: { numFmt: DATE_FMT } },
      { header: "Затраты", key: "description", width: 40 },
      { header: "Сумма", key: "amount", width: 12 },
      { header: "Налоги", key: "NALOG", width: 12 },
      { header: "Себестоимость", key: "SEBESTOIMOST", width: 14 },
      { header: "Заработная плата", key: "ZARPLATA", width: 16 },
      { header: "Развитие", key: "RAZVITIE", width: 12 },
      { header: "Мастерская", key: "MASTERSKAYA", width: 12 },
      { header: "Отправка", key: "OTPRAVKA", width: 12 },
    ];
    const yearExpenses = expenses.filter((e) => e.date.getFullYear() === year);
    for (const e of yearExpenses) {
      const rowNum = expenseSheet.rowCount + 1;
      expenseSheet.addRow({
        date: e.date,
        description: e.description,
        amount: { formula: `SUM(D${rowNum}:I${rowNum})`, result: e.amount },
        [e.category]: e.amount,
      });
    }
    if (yearExpenses.length > 0) {
      const first = 2;
      const last = expenseSheet.rowCount;
      const sumByCategory = (category: string) =>
        yearExpenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);
      expenseSheet.addRow({
        description: "Итого",
        amount: { formula: `SUM(C${first}:C${last})`, result: yearExpenses.reduce((sum, e) => sum + e.amount, 0) },
        NALOG: { formula: `SUM(D${first}:D${last})`, result: sumByCategory("NALOG") },
        SEBESTOIMOST: { formula: `SUM(E${first}:E${last})`, result: sumByCategory("SEBESTOIMOST") },
        ZARPLATA: { formula: `SUM(F${first}:F${last})`, result: sumByCategory("ZARPLATA") },
        RAZVITIE: { formula: `SUM(G${first}:G${last})`, result: sumByCategory("RAZVITIE") },
        MASTERSKAYA: { formula: `SUM(H${first}:H${last})`, result: sumByCategory("MASTERSKAYA") },
        OTPRAVKA: { formula: `SUM(I${first}:I${last})`, result: sumByCategory("OTPRAVKA") },
      });
    }

    const incomeSheet = workbook.addWorksheet(`Доходы ${year}`);
    incomeSheet.columns = [
      { header: "№ п/п", key: "seq", width: 8 },
      { header: "Дата", key: "date", width: 12, style: { numFmt: DATE_FMT } },
      { header: "Доход", key: "saleDetails", width: 40 },
      { header: "Сумма", key: "amount", width: 12 },
      { header: "Отправка", key: "shipping", width: 12 },
      { header: "Доставка", key: "delivery", width: 12 },
      { header: "Нал/безнал", key: "paymentMethod", width: 12 },
      { header: "Тип", key: "productType", width: 30 },
      // Подтягивается из «Типы товаров» по названию типа — основа для
      // Себестоимости в квартальном отчёте ниже.
      { header: "Себестоимость", key: "cost", width: 14 },
    ];
    const yearIncomes = incomes.filter((i) => i.date.getFullYear() === year);
    yearIncomes.forEach((i, idx) => {
      const rowNum = incomeSheet.rowCount + 1;
      incomeSheet.addRow({
        seq: idx + 1,
        date: i.date,
        saleDetails: i.saleDetails ?? "",
        amount: i.amount,
        shipping: i.shipping,
        delivery: i.delivery,
        paymentMethod: PAYMENT_METHOD_LABELS[i.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] ?? i.paymentMethod,
        productType: i.productType ? (typeLabel.get(i.productType) ?? i.productType) : "",
        cost: {
          formula: `IFERROR(VLOOKUP(H${rowNum},'Типы товаров'!$B:$C,2,0),0)`,
          result: i.productType ? (typeCost.get(i.productType) ?? 0) : 0,
        },
      });
    });
    if (yearIncomes.length > 0) {
      const first = 2;
      const last = incomeSheet.rowCount;
      const costTotal = yearIncomes.reduce((sum, i) => sum + (i.productType ? (typeCost.get(i.productType) ?? 0) : 0), 0);
      incomeSheet.addRow({
        saleDetails: "Итого",
        amount: { formula: `SUM(D${first}:D${last})`, result: yearIncomes.reduce((sum, i) => sum + i.amount, 0) },
        shipping: { formula: `SUM(E${first}:E${last})`, result: yearIncomes.reduce((sum, i) => sum + i.shipping, 0) },
        delivery: { formula: `SUM(F${first}:F${last})`, result: yearIncomes.reduce((sum, i) => sum + i.delivery, 0) },
        cost: { formula: `SUM(I${first}:I${last})`, result: costTotal },
      });
    }
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
      const rowNum = quarterSheet.rowCount + 1;
      const A = `$A${rowNum}`;
      const B = `$B${rowNum}`;
      // Границы квартала и налогового окна (налог за месяц платится в следующем
      // месяце — то же смещение, что и в src/lib/reports.ts) считаются формулой
      // DATE(), поэтому меняются сами, если квартал в строке поправить вручную.
      // Ссылки на листы Доходы/Расходы конкретного года — literal-строкой (а не
      // через INDIRECT($A…)): динамические ссылки на лист по значению ячейки
      // не поддерживаются массово в Google Таблицах и часть настольных клиентов,
      // а год строки и так не предполагается менять — только сами доходы/расходы.
      const qStart = `DATE(${A},(${B}-1)*3+1,1)`;
      const qEnd = `DATE(${A},(${B}-1)*3+4,1)`;
      const taxStart = `DATE(${A},(${B}-1)*3+2,1)`;
      const taxEnd = `DATE(${A},(${B}-1)*3+5,1)`;

      const incomeSheet = `'Доходы ${year}'`;
      const expenseSheet = `'Расходы ${year}'`;
      const nextYearExpenseSheet = `'Расходы ${year + 1}'`;
      const hasNextYearSheet = years.includes(year + 1);

      const sumIncomeCol = (col: string) =>
        `SUMIFS(${incomeSheet}!${col}:${col},${incomeSheet}!B:B,">="&${qStart},${incomeSheet}!B:B,"<"&${qEnd})`;
      const sumExpenseCol = (col: string) =>
        `SUMIFS(${expenseSheet}!${col}:${col},${expenseSheet}!A:A,">="&${qStart},${expenseSheet}!A:A,"<"&${qEnd})`;
      const sumExpenseColInRange = (sheet: string, col: string, start: string, end: string) =>
        `SUMIFS(${sheet}!${col}:${col},${sheet}!A:A,">="&${start},${sheet}!A:A,"<"&${end})`;

      const taxThisYear = sumExpenseColInRange(expenseSheet, "D", taxStart, taxEnd);
      const taxFormula = hasNextYearSheet
        ? `${taxThisYear}+${sumExpenseColInRange(nextYearExpenseSheet, "D", taxStart, taxEnd)}`
        : taxThisYear;

      quarterSheet.addRow({
        year,
        quarter,
        brutto: { formula: sumIncomeCol("D"), result: report.brutto },
        cost: { formula: sumIncomeCol("I"), result: report.totalCost },
        masterskaya: { formula: sumExpenseCol("H"), result: report.masterskaya },
        razvitie: { formula: sumExpenseCol("G"), result: report.razvitieFakt },
        peresylka: { formula: sumExpenseCol("I"), result: report.peresylka },
        tax: { formula: taxFormula, result: report.tax },
        ostatok: {
          formula: `C${rowNum}-D${rowNum}-H${rowNum}-E${rowNum}-F${rowNum}`,
          result: report.ostatok,
        },
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
