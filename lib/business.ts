export type BusinessKind = "courseware" | "inspection" | "quote" | "maintenance";

export type BusinessRun<T = unknown> = {
  id: string;
  kind: BusinessKind;
  status: "completed" | "failed";
  input: Record<string, unknown>;
  result: T;
  mode: "live" | "mock" | "fallback";
  traceId: string;
  modelVersions: Record<string, string>;
  createdAt: string;
};

export type InspectionResult = {
  summary: string;
  scene: string;
  riskLevel: "low" | "medium" | "high";
  findings: Array<{ code: string; name: string; severity: string; confidence: number; action: string }>;
  requiresReview: boolean;
};

export type QuoteResult = {
  vehicle: string;
  diagnosis: string;
  items: Array<{ name: string; reason: string; quantity: number; unitPrice: number; laborPrice: number }>;
  total: number;
  disclaimer: string;
  sources: string[];
};

export type MaintenanceResult = {
  vehicle: string;
  mileage: number;
  strategy: string;
  items: Array<{ name: string; priority: "必须" | "建议" | "观察"; reason: string; cycle: string }>;
  nextVisit: string;
  sources: string[];
};
