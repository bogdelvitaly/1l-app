"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { moveTrelloCard } from "@/lib/trello";

export async function moveCardAction(cardId: string, listId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await moveTrelloCard(cardId, listId);
  revalidatePath("/orders");
}
