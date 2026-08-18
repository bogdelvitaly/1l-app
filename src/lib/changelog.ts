import { prisma } from "@/lib/prisma";

export async function logChange(params: {
  entityType: "Expense" | "Income" | "Certificate";
  entityId: string;
  action: "create" | "update" | "delete";
  diff: unknown;
  userId: string;
}) {
  await prisma.changeLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      diff: JSON.stringify(params.diff),
      userId: params.userId,
    },
  });
}
