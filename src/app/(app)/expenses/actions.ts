"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logChange } from "@/lib/changelog";
import { expenseSchema } from "@/lib/types";

function parseForm(formData: FormData) {
  return expenseSchema.parse({
    date: formData.get("date"),
    description: formData.get("description"),
    category: formData.get("category"),
    amount: formData.get("amount"),
  });
}

export async function createExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  const created = await prisma.expense.create({
    data: { ...data, createdById: session.user.id },
  });
  await logChange({
    entityType: "Expense",
    entityId: created.id,
    action: "create",
    diff: { after: data },
    userId: session.user.id,
  });

  revalidatePath("/expenses");
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  const before = await prisma.expense.findUnique({ where: { id } });
  await prisma.expense.update({ where: { id }, data });
  await logChange({
    entityType: "Expense",
    entityId: id,
    action: "update",
    diff: { before, after: data },
    userId: session.user.id,
  });

  revalidatePath("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  const before = await prisma.expense.findUnique({ where: { id } });
  if (!before) return;

  await prisma.expense.delete({ where: { id } });
  await logChange({
    entityType: "Expense",
    entityId: id,
    action: "delete",
    diff: { before },
    userId: session.user.id,
  });

  revalidatePath("/expenses");
}
