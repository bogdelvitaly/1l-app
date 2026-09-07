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
