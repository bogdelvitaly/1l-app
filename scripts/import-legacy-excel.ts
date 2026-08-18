/**
 * One-off / repeatable import of a legacy "Бухгалтерия.xlsx"-style bookkeeping
 * file into the app's database (same logic used by the in-app upload in
 * /settings). Sheets must be named "Расходы {год}" / "Доходы {год}".
 *
 * Usage:
 *   npm run import:legacy -- "C:\path\to\Бухгалтерия.xlsx" [username]
 *
 * username defaults to "admin" (must already exist, see prisma/seed.ts).
 */
import ExcelJS from "exceljs";
import { prisma } from "../src/lib/prisma";
import { importLegacyWorkbook } from "../src/lib/legacyImport";

async function main() {
  const filePath = process.argv[2];
  const username = process.argv[3] ?? "admin";
  if (!filePath) {
    console.error("Использование: npm run import:legacy -- <путь к .xlsx> [username]");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    console.error(`Пользователь "${username}" не найден. Сначала выполните prisma/seed.ts.`);
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const result = await importLegacyWorkbook(workbook, user.id);
  for (const s of result.perSheet) {
    console.log(`${s.sheet}: импортировано — ${s.created}, пропущено строк — ${s.skipped}`);
  }
  console.log(
    `\nГотово. Всего расходов: ${result.totalExpenses}, доходов: ${result.totalIncomes}, пропущено строк: ${result.totalSkipped}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
