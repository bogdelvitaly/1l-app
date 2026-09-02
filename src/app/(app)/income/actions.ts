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
    productId: formData.get("productId") || undefined,
    buyer: formData.get("buyer") || undefined,
    city: formData.get("city") || undefined,
    source: formData.get("source") || undefined,
    // Unchecked checkboxes are absent from FormData entirely (not "false").
    taxable: formData.has("taxable"),
  });
}

// productType isn't submitted by the form anymore — it's derived from the
// selected Product's catalog type (Товар is required, so productId is always set).
async function resolveProductType(productId: string): Promise<string | null> {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { productType: true } });
  return product?.productType.code ?? null;
}

export async function createIncome(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  const productType = await resolveProductType(data.productId);
  const created = await prisma.income.create({
    data: { ...data, productType, createdById: session.user.id },
  });
  await logChange({
    entityType: "Income",
    entityId: created.id,
    action: "create",
    diff: { ...data, productType },
    userId: session.user.id,
  });

  revalidatePath("/income");
}

export async function updateIncome(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = parseForm(formData);
  const productType = await resolveProductType(data.productId);
  await prisma.income.update({ where: { id }, data: { ...data, productType } });
  await logChange({
    entityType: "Income",
    entityId: id,
    action: "update",
    diff: { ...data, productType },
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
