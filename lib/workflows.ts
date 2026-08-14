import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { callFoundation, foundationConfigured, mockFoundation, type FoundationResult } from "./foundation";
import type { InspectionResult, MaintenanceResult, QuoteResult } from "./business";

type Json = Record<string, unknown>;
const WorkflowState = Annotation.Root({
  input: Annotation<Json>,
  visual: Annotation<Json>,
  evidence: Annotation<Json>,
  result: Annotation<Json>,
  traceId: Annotation<string>,
  mode: Annotation<"live" | "mock" | "fallback">,
  modelVersions: Annotation<Record<string, string>>,
});

function unwrap<T>(value: FoundationResult<T>) {
  return { result: value.data as Json, traceId: value.traceId, mode: value.mode, modelVersions: value.modelVersions };
}

const mockInspection: InspectionResult = {
  summary: "疑似发现轮胎胎侧异常，建议人工复核后生成整改或维修任务。",
  scene: "tire_inspection",
  riskLevel: "high",
  findings: [{ code: "tire.sidewall.bulge", name: "疑似胎侧鼓包", severity: "high", confidence: 0.87, action: "停止高速行驶并由技师现场复核" }],
  requiresReview: true,
};

const mockQuote: QuoteResult = {
  vehicle: "示例车辆 · 2021款紧凑型轿车",
  diagnosis: "根据检测结果，轮胎存在异常磨损，建议先进行四轮定位检查，再确认是否更换。",
  items: [
    { name: "四轮定位检测", reason: "排查异常磨损原因", quantity: 1, unitPrice: 0, laborPrice: 120 },
    { name: "轮胎更换（待车型适配确认）", reason: "胎纹及侧壁状态需现场确认", quantity: 2, unitPrice: 520, laborPrice: 80 },
  ],
  total: 1240,
  disclaimer: "AI报价为预估，最终以门店实车检测、商品库存和实时价格为准。",
  sources: ["轮胎异常磨损诊断规范 v3.1", "门店维修报价规则 v2.4"],
};

const mockMaintenance: MaintenanceResult = {
  vehicle: "示例车辆 · 2021款紧凑型轿车",
  mileage: 60000,
  strategy: "安全项优先、按车况分级，不进行无依据的套餐推荐。",
  items: [
    { name: "机油及机油滤芯", priority: "必须", reason: "已达到常规保养周期", cycle: "本次处理" },
    { name: "制动液检测", priority: "建议", reason: "结合使用年限检测含水率", cycle: "本次检测后决定" },
    { name: "蓄电池健康度检测", priority: "观察", reason: "进入常见性能衰减周期", cycle: "每6个月检测" },
  ],
  nextVisit: "6个月或行驶10000公里后，以先到者为准",
  sources: ["车辆周期保养标准 v4.0", "门店养护推荐合规规则 v2.2"],
};

export async function runInspection(input: Json) {
  const graph = new StateGraph(WorkflowState)
    .addNode("visual_analysis", async (state) => {
      if (!foundationConfigured()) return { visual: mockInspection as unknown as Json, mode: "mock" as const };
      const response = await callFoundation<Json>("/foundation/v1/vision/analyze", {
        image_id: state.input.imageId,
        scene: state.input.scene || "store_inspection",
        question: state.input.question || "识别不合规项并给出证据",
        capabilities: ["detection", "ocr", "vision_language"],
        response_schema: "ai_ops_inspection_v1",
      });
      return { visual: response.data, traceId: response.traceId, mode: response.mode, modelVersions: response.modelVersions };
    })
    .addNode("business_rules", (state) => ({ result: state.visual }))
    .addEdge(START, "visual_analysis").addEdge("visual_analysis", "business_rules").addEdge("business_rules", END).compile();
  const state = await graph.invoke({ input, visual: {}, evidence: {}, result: {}, traceId: "", mode: "mock", modelVersions: {} });
  return { data: state.result as unknown as InspectionResult, traceId: state.traceId || `mock_${crypto.randomUUID()}`, mode: state.mode, modelVersions: state.modelVersions };
}

export async function runQuote(input: Json) {
  const graph = new StateGraph(WorkflowState)
    .addNode("visual_analysis", async (state) => {
      if (!state.input.imageId || !foundationConfigured()) return { visual: { summary: state.input.findings || "轮胎异常磨损" } };
      const response = await callFoundation<Json>("/foundation/v1/vision/analyze", { image_id: state.input.imageId, scene: "repair_quote", question: "提取车辆缺陷、部件、文字和风险", capabilities: ["detection", "ocr", "vision_language"], response_schema: "repair_findings_v1" });
      return { visual: response.data, traceId: response.traceId, mode: response.mode, modelVersions: response.modelVersions };
    })
    .addNode("retrieve", async (state) => {
      if (!foundationConfigured()) return { evidence: { sources: mockQuote.sources } };
      const response = await callFoundation<Json>("/foundation/v1/embeddings", { query: JSON.stringify(state.visual), namespace: "repair_quote", top_k: 8 });
      return { evidence: response.data };
    })
    .addNode("quote", async (state) => {
      if (!foundationConfigured()) return unwrap(mockFoundation(mockQuote, { text: "mock-qwen" }));
      const response = await callFoundation<QuoteResult>("/foundation/v1/text/chat", { task: "repair_quote", model_mode: "reasoning", input: state.input, visual_result: state.visual, evidence: state.evidence, response_schema: "repair_quote_v1" });
      return unwrap(response);
    })
    .addEdge(START, "visual_analysis").addEdge("visual_analysis", "retrieve").addEdge("retrieve", "quote").addEdge("quote", END).compile();
  const state = await graph.invoke({ input, visual: {}, evidence: {}, result: {}, traceId: "", mode: foundationConfigured() ? "live" : "mock", modelVersions: {} });
  return { data: state.result as unknown as QuoteResult, traceId: state.traceId || `mock_${crypto.randomUUID()}`, mode: state.mode, modelVersions: state.modelVersions };
}

export async function runMaintenance(input: Json) {
  const graph = new StateGraph(WorkflowState)
    .addNode("retrieve", async () => {
      if (!foundationConfigured()) return { evidence: { sources: mockMaintenance.sources } };
      const response = await callFoundation<Json>("/foundation/v1/embeddings", { query: input, namespace: "maintenance_knowledge", top_k: 10 });
      return { evidence: response.data, traceId: response.traceId, modelVersions: response.modelVersions };
    })
    .addNode("plan", async (state) => {
      if (!foundationConfigured()) return unwrap(mockFoundation({ ...mockMaintenance, vehicle: String(input.vehicle || mockMaintenance.vehicle), mileage: Number(input.mileage || 60000) }, { text: "mock-qwen" }));
      const response = await callFoundation<MaintenanceResult>("/foundation/v1/text/chat", { task: "maintenance_plan", model_mode: "reasoning", input: state.input, evidence: state.evidence, response_schema: "maintenance_plan_v1" });
      return unwrap(response);
    })
    .addEdge(START, "retrieve").addEdge("retrieve", "plan").addEdge("plan", END).compile();
  const state = await graph.invoke({ input, visual: {}, evidence: {}, result: {}, traceId: "", mode: foundationConfigured() ? "live" : "mock", modelVersions: {} });
  return { data: state.result as unknown as MaintenanceResult, traceId: state.traceId || `mock_${crypto.randomUUID()}`, mode: state.mode, modelVersions: state.modelVersions };
}
