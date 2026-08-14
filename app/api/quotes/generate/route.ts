import { saveBusinessRun } from "@/lib/db";
import { runQuote } from "@/lib/workflows";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!input.vehicle && !input.findings && !input.imageId) return Response.json({ message: "请填写车辆、检测结果或imageId" }, { status: 400 });
  try {
    const output = await runQuote(input);
    return Response.json({ run: await saveBusinessRun({ kind: "quote", input, result: output.data, mode: output.mode, traceId: output.traceId, modelVersions: output.modelVersions }) });
  } catch (error) {
    console.error("quote workflow failure", error);
    return Response.json({ message: "检测报价执行失败" }, { status: 502 });
  }
}
