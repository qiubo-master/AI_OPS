export type FoundationEnvelope<T> = {
  request_id?: string;
  trace_id?: string;
  data?: T;
  error?: { code?: string; message?: string } | null;
  model_versions?: Record<string, string>;
  timings_ms?: Record<string, number>;
};

export type FoundationResult<T> = {
  data: T;
  traceId: string;
  modelVersions: Record<string, string>;
  mode: "live" | "mock";
};

const baseUrl = () => process.env.FOUNDATION_API_URL?.replace(/\/$/, "");

export function foundationConfigured() {
  return Boolean(baseUrl() && process.env.FOUNDATION_API_KEY);
}

export async function callFoundation<T>(path: string, body: unknown): Promise<FoundationResult<T>> {
  const base = baseUrl();
  const token = process.env.FOUNDATION_API_KEY;
  if (!base || !token) throw new Error("foundation_not_configured");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "x-app-id": process.env.FOUNDATION_APP_ID || "ai-ops",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(process.env.FOUNDATION_TIMEOUT_MS || 90_000)),
  });
  const payload = (await response.json().catch(() => ({}))) as FoundationEnvelope<T> & T;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message || `foundation_${response.status}`);
  }
  return {
    data: (payload.data ?? payload) as T,
    traceId: payload.trace_id || payload.request_id || crypto.randomUUID(),
    modelVersions: payload.model_versions || {},
    mode: "live",
  };
}

export function mockFoundation<T>(data: T, modelVersions: Record<string, string> = {}): FoundationResult<T> {
  return { data, traceId: `mock_${crypto.randomUUID()}`, modelVersions, mode: "mock" };
}
