import { NextResponse } from "next/server";

// Temporary diagnostic route — reports presence of required env vars without
// leaking their values, to debug a production-only NextAuth config error.
// Remove once the Vercel deployment is confirmed working.
export async function GET() {
  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlHost: process.env.DATABASE_URL?.match(/@([^/]+)\//)?.[1] ?? null,
    vercel: process.env.VERCEL ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    nextRuntime: process.env.NEXT_RUNTIME ?? null,
  });
}
