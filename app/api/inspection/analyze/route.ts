import { saveBusinessRun } from "@/lib/db";
import { runInspection } from "@/lib/workflows";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!input.imageId) return Response.json({ message: "请提供通用基座中的imageId" }, { status: 400 });
  try {
    const output = await runInspection(input);
    return Response.json({ run: await saveBusinessRun({ kind: "inspection", input, result: output.data, mode: output.mode, traceId: output.traceId, modelVersions: output.modelVersions }) });
  } catch (error) {
    console.error("inspection workflow failure", error);
    return Response.json({ message: "视觉巡检执行失败" }, { status: 502 });
  }
}
