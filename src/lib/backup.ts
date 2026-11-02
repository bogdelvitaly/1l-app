import { prisma } from "@/lib/prisma";
import { buildExportWorkbook } from "@/lib/exportWorkbook";

// Full backup of the 1L database, shared by the weekly Google Drive upload
// (src/app/api/cron/backup/route.ts) and the manual `npm run backup:weekly`.
// Returns a readable .xlsx (the in-app export plus sheets for everything it
// leaves out) and a .json dump of every table. User password hashes are
// deliberately not included.
export async function buildBackup() {
  const stamp = new Date().toISOString().slice(0, 10);

  const [users, expenses, incomes, certificates, productTypes, costComponents, products, stores, storeProducts, orderSequences, changeLogs] =
    await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, username: true, createdAt: true } }),
      prisma.expense.findMany({ orderBy: { date: "asc" } }),
      prisma.income.findMany({ orderBy: { date: "asc" } }),
      prisma.certificate.findMany({ orderBy: { sequenceNo: "asc" } }),
      prisma.productType.findMany(),
      prisma.costComponent.findMany(),
      prisma.product.findMany(),
      prisma.store.findMany(),
      prisma.storeProduct.findMany(),
      prisma.orderSequence.findMany(),
      prisma.changeLog.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  // --- JSON: every row of every table, enough to rebuild the database from.
  const dump = { exportedAt: new Date().toISOString(), users, expenses, incomes, certificates, productTypes, costComponents, products, stores, storeProducts, orderSequences, changeLogs };
  const json = JSON.stringify(dump, null, 2);

  // --- XLSX: the regular export first, then what it doesn't cover.
  const workbook = await buildExportWorkbook();
  const productName = new Map(products.map((p) => [p.id, p.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const incomeAll = workbook.addWorksheet("Доходы — все поля");
  incomeAll.columns = [
    { header: "Дата", key: "date", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Детали", key: "saleDetails", width: 36 },
    { header: "Товар", key: "product", width: 24 },
    { header: "Покупатель", key: "buyer", width: 20 },
    { header: "Город", key: "city", width: 16 },
    { header: "Источник", key: "source", width: 14 },
    { header: "Сумма", key: "amount", width: 12 },
    { header: "Отправка", key: "shipping", width: 12 },
    { header: "Доставка", key: "delivery", width: 12 },
    { header: "Нал/безнал", key: "paymentMethod", width: 12 },
    { header: "Облагается налогом", key: "taxable", width: 18 },
    { header: "Trello-карточка", key: "trelloCardId", width: 28 },
    { header: "Кто добавил", key: "createdBy", width: 16 },
  ];
  for (const i of incomes) {
    incomeAll.addRow({
      date: i.date,
      saleDetails: i.saleDetails ?? "",
      product: i.productId ? (productName.get(i.productId) ?? "") : "",
      buyer: i.buyer ?? "",
      city: i.city ?? "",
      source: i.source ?? "",
      amount: i.amount,
      shipping: i.shipping,
      delivery: i.delivery,
      paymentMethod: i.paymentMethod,
      taxable: i.taxable ? "да" : "нет",
      trelloCardId: i.trelloCardId ?? "",
      createdBy: userName.get(i.createdById) ?? "",
    });
  }

  const certSheet = workbook.addWorksheet("Сертификаты");
  certSheet.columns = [
    { header: "№", key: "sequenceNo", width: 8 },
    { header: "Номер", key: "number", width: 18 },
    { header: "Сумма", key: "amount", width: 12 },
    { header: "Дата", key: "date", width: 12, style: { numFmt: "dd.mm.yyyy" } },
    { header: "Кто добавил", key: "createdBy", width: 16 },
  ];
  for (const c of certificates) {
    certSheet.addRow({ ...c, createdBy: userName.get(c.createdById) ?? "" });
  }

  const storeSheet = workbook.addWorksheet("Магазины");
  storeSheet.columns = [
    { header: "Магазин", key: "name", width: 28 },
    { header: "Адрес", key: "location", width: 36 },
    { header: "Товар", key: "product", width: 24 },
  ];
  for (const s of stores) {
    const onShelf = storeProducts.filter((sp) => sp.storeId === s.id);
    if (onShelf.length === 0) storeSheet.addRow({ name: s.name, location: s.location, product: "" });
    for (const sp of onShelf) {
      storeSheet.addRow({ name: s.name, location: s.location, product: productName.get(sp.productId) ?? "" });
    }
  }

  const userSheet = workbook.addWorksheet("Пользователи");
  userSheet.columns = [
    { header: "Имя", key: "name", width: 22 },
    { header: "Логин", key: "username", width: 18 },
    { header: "Создан", key: "createdAt", width: 18, style: { numFmt: "dd.mm.yyyy hh:mm" } },
  ];
  for (const u of users) userSheet.addRow(u);

  const logSheet = workbook.addWorksheet("Журнал изменений");
  logSheet.columns = [
    { header: "Когда", key: "createdAt", width: 18, style: { numFmt: "dd.mm.yyyy hh:mm" } },
    { header: "Кто", key: "user", width: 16 },
    { header: "Объект", key: "entityType", width: 14 },
    { header: "Действие", key: "action", width: 10 },
    { header: "Изменения", key: "diff", width: 80 },
  ];
  for (const l of changeLogs) {
    logSheet.addRow({ createdAt: l.createdAt, user: userName.get(l.userId) ?? "", entityType: l.entityType, action: l.action, diff: l.diff });
  }

  const xlsx = Buffer.from(await workbook.xlsx.writeBuffer());
  const summary = `${incomes.length} доходов, ${expenses.length} расходов, ${certificates.length} сертификатов, ${changeLogs.length} записей журнала`;
  return { stamp, xlsx, json, summary };
}
