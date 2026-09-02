"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logChange } from "@/lib/changelog";

type ExpenseSnapshot = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

// Undo is scoped to Expense delete/update only — those are the only actions
// that currently log a full "before" snapshot (see expenses/actions.ts).
export async function undoChange(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const logId = String(formData.get("logId"));
  const log = await prisma.changeLog.findUnique({ where: { id: logId } });
  if (!log || log.entityType !== "Expense") return;
  if (log.action !== "delete" && log.action !== "update") return;

  const diff = JSON.parse(log.diff) as { before?: ExpenseSnapshot };
  const before = diff.before;
  if (!before) return;

  if (log.action === "delete") {
    const exists = await prisma.expense.findUnique({ where: { id: before.id } });
    if (exists) return;
    await prisma.expense.create({
      data: {
        id: before.id,
        date: new Date(before.date),
        description: before.description,
        category: before.category,
        amount: before.amount,
        createdById: before.createdById,
        createdAt: new Date(before.createdAt),
        updatedAt: new Date(before.updatedAt),
      },
    });
  } else {
    const current = await prisma.expense.findUnique({ where: { id: log.entityId } });
    if (!current) return;
    await prisma.expense.update({
      where: { id: log.entityId },
      data: {
        date: new Date(before.date),
        description: before.description,
        category: before.category,
        amount: before.amount,
      },
    });
  }

  await logChange({
    entityType: "Expense",
    entityId: log.entityId,
    action: "restore",
    diff: { after: before },
    userId: session.user.id,
  });

  revalidatePath("/expenses");
  revalidatePath("/history");
}
