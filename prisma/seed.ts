import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_PRODUCT_TYPES } from "../src/lib/types";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.SEED_USERNAME ?? "admin";
  const password = process.env.SEED_PASSWORD ?? "admin1234";
  const name = process.env.SEED_NAME ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { name, username, passwordHash } });
    console.log(`Создан пользователь "${username}" / "${password}" — смени пароль после первого входа.`);
  } else {
    console.log(`Пользователь "${username}" уже существует, пропускаю.`);
  }

  for (const { code, label } of DEFAULT_PRODUCT_TYPES) {
    const productType = await prisma.productType.upsert({
      where: { code },
      update: {},
      create: { code, label },
    });

    const componentCount = await prisma.costComponent.count({ where: { productTypeId: productType.id } });
    if (componentCount === 0) {
      await prisma.costComponent.create({
        data: { productTypeId: productType.id, name: "Стоимость себестоимости типа", price: 0 },
      });
    }
  }
  console.log("Типы товара инициализированы — заполнить компоненты себестоимости в /settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
