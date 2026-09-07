// Server-only — reads TRELLO_KEY/TRELLO_TOKEN from env, never exposed to the client.
// The "Заказы" tab has no local copy of this data: every page load re-fetches
// live from Trello, so there's nothing here to keep in sync with the DB.
const TRELLO_BASE = "https://api.trello.com/1";

function trelloAuth() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  if (!key || !token) throw new Error("TRELLO_KEY/TRELLO_TOKEN не настроены");
  return { key, token };
}

export type TrelloList = { id: string; name: string; pos: number };

export type TrelloCard = {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  dueComplete: boolean;
  dateLastActivity: string;
  idList: string;
  pos: number;
  shortUrl: string;
};

export async function getBoardData(): Promise<{ lists: TrelloList[]; cardsByList: Record<string, TrelloCard[]> }> {
  const { key, token } = trelloAuth();
  const boardId = process.env.TRELLO_BOARD_ID;
  if (!boardId) throw new Error("TRELLO_BOARD_ID не настроен");

  const [listsRes, cardsRes] = await Promise.all([
    fetch(`${TRELLO_BASE}/boards/${boardId}/lists?key=${key}&token=${token}&filter=open&fields=name,pos`, {
      cache: "no-store",
    }),
    fetch(
      `${TRELLO_BASE}/boards/${boardId}/cards?key=${key}&token=${token}&filter=open&fields=name,desc,due,dueComplete,dateLastActivity,idList,pos,shortUrl`,
      { cache: "no-store" },
    ),
  ]);

  if (!listsRes.ok) throw new Error(`Trello lists error: ${listsRes.status}`);
  if (!cardsRes.ok) throw new Error(`Trello cards error: ${cardsRes.status}`);

  const lists = (await listsRes.json()) as TrelloList[];
  const cards = (await cardsRes.json()) as TrelloCard[];

  lists.sort((a, b) => a.pos - b.pos);

  const cardsByList: Record<string, TrelloCard[]> = {};
  for (const list of lists) cardsByList[list.id] = [];
  for (const card of cards) {
    (cardsByList[card.idList] ??= []).push(card);
  }
  // Most-recently-active first — matters most for large archive lists like Done.
  for (const listCards of Object.values(cardsByList)) {
    listCards.sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime());
  }

  return { lists, cardsByList };
}

export async function moveTrelloCard(cardId: string, idList: string) {
  const { key, token } = trelloAuth();
  const res = await fetch(`${TRELLO_BASE}/cards/${cardId}?key=${key}&token=${token}&idList=${idList}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`Trello move error: ${res.status}`);
}

// New orders always land in the board's first list ("To Do" on this board) —
// found by name so it keeps working if lists ever get reordered.
export async function getIntakeListId(): Promise<string> {
  const { lists } = await getBoardData();
  const todo = lists.find((l) => l.name.trim().toLowerCase() === "to do");
  const target = todo ?? lists[0];
  if (!target) throw new Error("На доске нет ни одного списка");
  return target.id;
}

export async function createTrelloCard(params: { idList: string; name: string; desc: string; due?: string | null }) {
  const { key, token } = trelloAuth();
  const url = new URL(`${TRELLO_BASE}/cards`);
  url.searchParams.set("key", key);
  url.searchParams.set("token", token);
  url.searchParams.set("idList", params.idList);
  url.searchParams.set("name", params.name);
  url.searchParams.set("desc", params.desc);
  if (params.due) url.searchParams.set("due", params.due);
  const res = await fetch(url.toString(), { method: "POST" });
  if (!res.ok) throw new Error(`Trello create error: ${res.status}`);
  return (await res.json()) as TrelloCard;
}

export async function updateTrelloCard(
  cardId: string,
  params: { name?: string; desc?: string; due?: string | null },
) {
  const { key, token } = trelloAuth();
  const url = new URL(`${TRELLO_BASE}/cards/${cardId}`);
  url.searchParams.set("key", key);
  url.searchParams.set("token", token);
  if (params.name !== undefined) url.searchParams.set("name", params.name);
  if (params.desc !== undefined) url.searchParams.set("desc", params.desc);
  if (params.due !== undefined) url.searchParams.set("due", params.due ?? "");
  const res = await fetch(url.toString(), { method: "PUT" });
  if (!res.ok) throw new Error(`Trello update error: ${res.status}`);
  return (await res.json()) as TrelloCard;
}
