/**
 * Manual run of the same backup the weekly Vercel cron uploads to Google Drive:
 * writes the .xlsx and .json to a local folder.
 *
 * Usage:
 *   npm run backup:weekly -- [output folder]     (default: D:\Backups\1L)
 *
 * Reads DATABASE_URL from .env like every other script.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/prisma";
import { buildBackup } from "../src/lib/backup";

async function main() {
  const outDir = process.argv[2] ?? "D:/Backups/1L";
  mkdirSync(outDir, { recursive: true });
  const { stamp, xlsx, json, summary } = await buildBackup();
  writeFileSync(join(outDir, `1L-backup-${stamp}.xlsx`), xlsx);
  writeFileSync(join(outDir, `1L-backup-${stamp}.json`), json, "utf8");
  console.log(`OK ${stamp}: ${summary} → ${outDir}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
