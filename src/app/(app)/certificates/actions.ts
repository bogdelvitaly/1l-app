"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logChange } from "@/lib/changelog";
import { certificateSchema } from "@/lib/types";

const STARTING_SEQUENCE_NO = 13;

function formatNumber(sequenceNo: number, date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${sequenceNo}-${dd}${mm}${yyyy}`;
}

export async function createCertificate(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const data = certificateSchema.parse({
    amount: formData.get("amount"),
    date: formData.get("date"),
  });

  const last = await prisma.certificate.findFirst({ orderBy: { sequenceNo: "desc" } });
  const sequenceNo = last ? last.sequenceNo + 1 : STARTING_SEQUENCE_NO;
  const number = formatNumber(sequenceNo, data.date);

  const created = await prisma.certificate.create({
    data: {
      sequenceNo,
      number,
      amount: data.amount,
      date: data.date,
      createdById: session.user.id,
    },
  });

  await logChange({
    entityType: "Certificate",
    entityId: created.id,
    action: "create",
    diff: { number, amount: data.amount, date: data.date },
    userId: session.user.id,
  });

  revalidatePath("/certificates");
}

export async function deleteCertificate(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.certificate.delete({ where: { id } });
  await logChange({
    entityType: "Certificate",
    entityId: id,
    action: "delete",
    diff: {},
    userId: session.user.id,
  });

  revalidatePath("/certificates");
}
