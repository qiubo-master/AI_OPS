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
      llm: Boolean(process.env.CSS_LLM_API_URL),
      rag: Boolean(process.env.CSS_RAG_API_URL),
    },
  }, { status: database ? 200 : 503 });
}
