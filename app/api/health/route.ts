export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: "ai-ops",
    version: process.env.APP_VERSION ?? "dev",
    integrations: {
      llm: Boolean(process.env.CSS_LLM_API_URL),
      rag: Boolean(process.env.CSS_RAG_API_URL),
    },
  });
}
