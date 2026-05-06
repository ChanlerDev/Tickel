export interface ModelBreakdown {
  model: string;
  agent?: string;
  in: number;
  out: number;
  cw: number;
  cr: number;
  cost: number;
}

export interface ReceiptData {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number;
  title: string;
  date: string;
  templateId: string;
  models?: ModelBreakdown[];
}

export function parseReceiptParams(params: Record<string, string>): ReceiptData {
  const payloadData = parsePayloadParam(params.payload);
  if (payloadData) return payloadData;

  return parseLegacyReceiptParams(params);
}

function parseLegacyReceiptParams(params: Record<string, string>): ReceiptData {
  const data: ReceiptData = {
    model: params.model ?? "unknown",
    inputTokens: parseInteger(params.in),
    outputTokens: parseInteger(params.out),
    cacheWriteTokens: parseInteger(params.cw),
    cacheReadTokens: parseInteger(params.cr),
    cost: parseMoney(params.cost),
    title: params.title ?? "session",
    date: params.date ?? new Date().toISOString().split("T")[0],
    templateId: params.templateId ?? "default",
  };

  // Decode per-model breakdown if present
  if (params.models) {
    try {
      const json = atob(params.models.replace(/-/g, "+").replace(/_/g, "/"));
      data.models = parseModelBreakdown(JSON.parse(json));
    } catch {
      // ignore malformed models param
    }
  }

  return data;
}

interface ReceiptPayloadV2 {
  version: 2;
  source?: {
    agent?: string;
  };
  receipt?: {
    title?: string;
    date?: string;
    templateId?: string;
    totalCost?: number;
    totals?: {
      inputTokens?: number;
      outputTokens?: number;
      cacheWriteTokens?: number;
      cacheReadTokens?: number;
    };
    items?: Array<{
      agent?: string;
      model?: string;
      inputTokens?: number;
      outputTokens?: number;
      cacheWriteTokens?: number;
      cacheReadTokens?: number;
      cost?: number;
    }>;
  };
}

function parsePayloadParam(encoded: string | undefined): ReceiptData | null {
  if (!encoded) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as ReceiptPayloadV2;
    if (payload.version !== 2 || !payload.receipt) return null;

    const items = parsePayloadItems(payload);
    const firstItem = items[0];
    const fallbackAgent = payload.source?.agent ?? "unknown";
    const totals = payload.receipt.totals;
    const inputTokens = parseInteger(totals?.inputTokens ?? sum(items, "in"));
    const outputTokens = parseInteger(totals?.outputTokens ?? sum(items, "out"));
    const cacheWriteTokens = parseInteger(totals?.cacheWriteTokens ?? sum(items, "cw"));
    const cacheReadTokens = parseInteger(totals?.cacheReadTokens ?? sum(items, "cr"));

    return {
      model: items.length > 1 ? "mixed" : firstItem?.model ?? fallbackAgent,
      inputTokens,
      outputTokens,
      cacheWriteTokens,
      cacheReadTokens,
      cost: parseMoney(payload.receipt.totalCost ?? sum(items, "cost")),
      title: payload.receipt.title ?? "session",
      date: payload.receipt.date ?? new Date().toISOString().split("T")[0],
      templateId: payload.receipt.templateId ?? "default",
      models: items,
    };
  } catch {
    return null;
  }
}

function parsePayloadItems(payload: ReceiptPayloadV2): ModelBreakdown[] {
  const fallbackAgent = payload.source?.agent;
  const rawItems = Array.isArray(payload.receipt?.items) ? payload.receipt.items : [];
  return rawItems.map((item) => ({
    agent: item.agent ?? fallbackAgent,
    model: item.model ?? "unknown",
    in: parseInteger(item.inputTokens),
    out: parseInteger(item.outputTokens),
    cw: parseInteger(item.cacheWriteTokens),
    cr: parseInteger(item.cacheReadTokens),
    cost: parseMoney(item.cost),
  }));
}

function parseModelBreakdown(value: unknown): ModelBreakdown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => {
    const raw = item as Partial<ModelBreakdown>;
    return {
      agent: typeof raw.agent === "string" ? raw.agent : undefined,
      model: typeof raw.model === "string" ? raw.model : "unknown",
      in: parseInteger(raw.in),
      out: parseInteger(raw.out),
      cw: parseInteger(raw.cw),
      cr: parseInteger(raw.cr),
      cost: parseMoney(raw.cost),
    };
  });
}

function decodeBase64Url(value: string): string {
  return atob(value.replace(/-/g, "+").replace(/_/g, "/"));
}

function parseInteger(value: unknown): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? "0"), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function parseMoney(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "0"));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function sum(items: ModelBreakdown[], key: keyof Pick<ModelBreakdown, "in" | "out" | "cw" | "cr" | "cost">): number {
  return items.reduce((total, item) => total + item[key], 0);
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
