import { prisma } from "@/lib/prisma";
import { monthlyTax, quarterDateRange, quarterMonths, monthDateRange } from "@/lib/formulas";

export async function getQuarterlyReport(year: number, quarter: 1 | 2 | 3 | 4) {
  const { start, end } = quarterDateRange(year, quarter);

  const [incomes, expensesInRange, productTypes] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.expense.findMany({ where: { date: { gte: start, lt: end } } }),
    prisma.productType.findMany({ include: { components: true } }),
  ]);

  const typeInfo = new Map(
    productTypes.map((pt) => [
      pt.code,
      { label: pt.label, unitCost: pt.components.reduce((sum, c) => sum + c.price, 0) },
    ]),
  );

  // Налог считается помесячно (порог 450 BYN действует на каждый месяц отдельно), затем суммируется за квартал.
  let quarterTax = 0;
  for (const month of quarterMonths(quarter)) {
    const { start: mStart, end: mEnd } = monthDateRange(year, month);
    const monthRevenue = incomes
      .filter((i) => i.date >= mStart && i.date < mEnd)
      .reduce((sum, i) => sum + i.amount, 0);
    quarterTax += monthlyTax(monthRevenue);
  }

  const brutto = incomes.reduce((sum, i) => sum + i.amount, 0);

  const codesSold = Array.from(new Set(incomes.map((i) => i.productType)));

  const productRows = codesSold.map((code) => {
    const info = typeInfo.get(code);
    const rows = incomes.filter((i) => i.productType === code);
    const count = rows.length;
    const rowBrutto = rows.reduce((sum, i) => sum + i.amount, 0);
    const unitCost = info?.unitCost ?? 0;
    const cost = unitCost * count;
    const share = brutto > 0 ? rowBrutto / brutto : 0;
    const tax = quarterTax * share;
    const netto = rowBrutto - tax;
    return { productType: code, label: info?.label ?? code, count, brutto: rowBrutto, cost, tax, netto };
  });

  const totalCost = productRows.reduce((sum, r) => sum + r.cost, 0);

  const sumExpenseByCategory = (category: string) =>
    expensesInRange.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);

  const masterskaya = sumExpenseByCategory("MASTERSKAYA");
  const razvitieFakt = sumExpenseByCategory("RAZVITIE");
  const peresylka = sumExpenseByCategory("OTPRAVKA");

  const ostatok = brutto - totalCost - quarterTax - masterskaya - razvitieFakt;

  return {
    year,
    quarter,
    brutto,
    quarterTax,
    totalCost,
    masterskaya,
    razvitieFakt,
    peresylka,
    ostatok,
    productRows,
  };
}

const MONTH_LABELS = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

/** Помесячный тренд Остатка и Брутто за год — та же формула Остатка, что и в квартальном отчёте, просто на окне в один месяц вместо трёх. */
export async function getMonthlyTrend(year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [incomes, expenses, productTypes] = await Promise.all([
    prisma.income.findMany({ where: { date: { gte: yearStart, lt: yearEnd } } }),
    prisma.expense.findMany({ where: { date: { gte: yearStart, lt: yearEnd } } }),
    prisma.productType.findMany({ include: { components: true } }),
  ]);

  const unitCostByCode = new Map(
    productTypes.map((pt) => [pt.code, pt.components.reduce((sum, c) => sum + c.price, 0)]),
  );

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const { start, end } = monthDateRange(year, month);
    const monthIncomes = incomes.filter((inc) => inc.date >= start && inc.date < end);
    const monthExpenses = expenses.filter((exp) => exp.date >= start && exp.date < end);

    const brutto = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
    const tax = monthlyTax(brutto);

    const cost = Array.from(new Set(monthIncomes.map((inc) => inc.productType))).reduce((sum, code) => {
      const count = monthIncomes.filter((inc) => inc.productType === code).length;
      return sum + (unitCostByCode.get(code) ?? 0) * count;
    }, 0);

    const sumByCategory = (category: string) =>
      monthExpenses.filter((exp) => exp.category === category).reduce((sum, exp) => sum + exp.amount, 0);

    const ostatok = brutto - cost - tax - sumByCategory("MASTERSKAYA") - sumByCategory("RAZVITIE");

    return { month, label: MONTH_LABELS[i], brutto, ostatok };
  });
}
