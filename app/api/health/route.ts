export const dynamic = "force-dynamic";

import { databaseReady } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const database = await databaseReady().catch(() => false);
  return Response.json({
    status: database ? "ok" : "degraded",
    service: "ai-ops",
    version: process.env.APP_VERSION ?? "dev",
    integrations: {
      database,
      foundation: Boolean(process.env.FOUNDATION_API_URL && process.env.FOUNDATION_API_KEY),
      digitalHuman: Boolean(process.env.DIGITAL_HUMAN_API_URL && process.env.DIGITAL_HUMAN_API_KEY),
    },
  }, { status: database ? 200 : 503 });
}
