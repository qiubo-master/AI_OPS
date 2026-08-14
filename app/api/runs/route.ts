import { listBusinessRuns } from "@/lib/db";
import type { BusinessKind } from "@/lib/business";
export const runtime = "nodejs";
export async function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind") as BusinessKind | null;
  try { return Response.json({ runs: await listBusinessRuns(kind || undefined) }); }
  catch (error) { console.error("run list failure", error); return Response.json({ message: "运行记录不可用" }, { status: 503 }); }
}
