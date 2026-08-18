"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logChange } from "@/lib/changelog";
import { incomeSchema } from "@/lib/types";

function parseForm(formData: FormData) {
  return incomeSchema.parse({
    date: formData.get("date"),
    saleDetails: formData.get("saleDetails"),
    amount: formData.get("amount"),
    shipping: formData.get("shipping") || 0,
    delivery: formData.get("delivery") || 0,
    paymentMethod: formData.get("paymentMethod"),
    productType: formData.get("productType"),
  });
}

export async function createIncome(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  const created = await prisma.income.create({
    data: { ...data, createdById: session.user.id },
  });
  await logChange({
    entityType: "Income",
    entityId: created.id,
    action: "create",
    diff: data,
    userId: session.user.id,
  });

  revalidatePath("/income");
}

export async function updateIncome(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  await prisma.income.update({ where: { id }, data });
  await logChange({
    entityType: "Income",
    entityId: id,
    action: "update",
    diff: data,
    userId: session.user.id,
  });

  revalidatePath("/income");
}

export async function deleteIncome(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.income.delete({ where: { id } });
  await logChange({
    entityType: "Income",
    entityId: id,
    action: "delete",
    diff: {},
    userId: session.user.id,
  });

  revalidatePath("/income");
}
