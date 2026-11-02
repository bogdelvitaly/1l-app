import { NextResponse } from "next/server";
import { buildBackup } from "@/lib/backup";

// Weekly Google Drive backup. Vercel Cron calls this (see vercel.json) with
// `Authorization: Bearer $CRON_SECRET`; the files are then POSTed to the Google
// Apps Script web app in the backup Google account (scripts/drive-receiver.gs),
// which saves them into a Drive folder.
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  // Fails closed: without the env var nobody can trigger a database dump.
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const driveUrl = process.env.DRIVE_BACKUP_URL;
  const driveSecret = process.env.DRIVE_BACKUP_SECRET;
  if (!driveUrl || !driveSecret) {
    return NextResponse.json({ ok: false, error: "DRIVE_BACKUP_URL/DRIVE_BACKUP_SECRET не настроены" }, { status: 500 });
  }

  const { stamp, xlsx, json, summary } = await buildBackup();
  const res = await fetch(driveUrl, {
    method: "POST",
    // Apps Script web apps only reliably parse text/plain bodies.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret: driveSecret,
      files: [
        { name: `1L-backup-${stamp}.xlsx`, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", base64: xlsx.toString("base64") },
        { name: `1L-backup-${stamp}.json`, mime: "application/json", base64: Buffer.from(json, "utf8").toString("base64") },
      ],
    }),
    cache: "no-store",
  });

  const text = await res.text();
  let result: { ok?: boolean; error?: string } = {};
  try {
    result = JSON.parse(text);
  } catch {
    // Not JSON — typically a Google HTML error/login page; reported below.
  }
  if (!res.ok || !result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? `Drive ответил ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
  }
  return NextResponse.json({ ok: true, stamp, summary });
}
