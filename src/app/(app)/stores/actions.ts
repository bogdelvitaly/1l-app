"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeSchema } from "@/lib/types";

export async function createStore(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = storeSchema.parse({
    name: formData.get("name"),
    location: formData.get("location"),
  });

  await prisma.store.create({ data });
  revalidatePath("/stores");
}

export async function deleteStore(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.store.delete({ where: { id } });
  revalidatePath("/stores");
}

export async function addStoreProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const storeId = String(formData.get("storeId"));
  const productId = String(formData.get("productId"));
  if (!productId) return;

  await prisma.storeProduct.upsert({
    where: { storeId_productId: { storeId, productId } },
    create: { storeId, productId },
    update: {},
  });
  revalidatePath("/stores");
}

export async function removeStoreProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.storeProduct.delete({ where: { id } });
  revalidatePath("/stores");
}
