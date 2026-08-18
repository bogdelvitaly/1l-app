"use server";

import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productTypeSchema, costComponentSchema, userSchema } from "@/lib/types";
import { importLegacyWorkbook } from "@/lib/legacyImport";

const MAX_USERS = 10;

export async function createProductType(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = productTypeSchema.parse({
    code: formData.get("code"),
    label: formData.get("label"),
  });

  await prisma.productType.create({ data });
  revalidatePath("/settings");
}

export async function deleteProductType(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.productType.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function createComponent(productTypeId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = costComponentSchema.parse({
    name: formData.get("name"),
    price: formData.get("price"),
  });

  await prisma.costComponent.create({ data: { ...data, productTypeId } });
  revalidatePath("/settings");
}

export async function deleteComponent(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.costComponent.delete({ where: { id } });
  revalidatePath("/settings");
}

export async function importExcel(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  const url = (formData.get("url") as string | null)?.trim();

  // exceljs pulls in its own (older) @types/node transitively via @fast-csv,
  // whose Buffer type shape mismatches this project's — safe to bypass here.
  const workbook = new ExcelJS.Workbook();
  if (file && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buf as any);
  } else if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Не удалось скачать файл по ссылке");
    const buf = Buffer.from(await res.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buf as any);
  } else {
    throw new Error("Выберите файл или укажите ссылку");
  }

  const result = await importLegacyWorkbook(workbook, session.user.id);

  revalidatePath("/settings");
  revalidatePath("/income");
  revalidatePath("/expenses");
  redirect(
    `/settings?imported=1&expenses=${result.totalExpenses}&incomes=${result.totalIncomes}&skipped=${result.totalSkipped}`,
  );
}

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const count = await prisma.user.count();
  if (count >= MAX_USERS) {
    throw new Error(`Достигнут лимит участников (${MAX_USERS})`);
  }

  const data = userSchema.parse({
    name: formData.get("name"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  const passwordHash = await bcrypt.hash(data.password, 10);
  await prisma.user.create({ data: { name: data.name, username: data.username, passwordHash } });
  revalidatePath("/settings");
}

export async function deleteUser(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  if (id === session.user.id) {
    throw new Error("Нельзя удалить самого себя");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}
