import { saveBusinessRun } from "@/lib/db";
import { runMaintenance } from "@/lib/workflows";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const input = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!input.vehicle || !input.mileage) return Response.json({ message: "请填写车辆和里程" }, { status: 400 });
  try {
    const output = await runMaintenance(input);
    return Response.json({ run: await saveBusinessRun({ kind: "maintenance", input, result: output.data, mode: output.mode, traceId: output.traceId, modelVersions: output.modelVersions }) });
  } catch (error) {
    console.error("maintenance workflow failure", error);
    return Response.json({ message: "养护方案生成失败" }, { status: 502 });
  }
}
