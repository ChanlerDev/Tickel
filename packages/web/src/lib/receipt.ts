export interface ModelBreakdown {
  model: string;
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

function parseInteger(value: string | undefined, fallback = 0): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseFloatValue(value: string | undefined, fallback = 0): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundCurrency(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

export function parseReceiptParams(params: Record<string, string>): ReceiptData {
  const data: ReceiptData = {
    model: params.model ?? "unknown",
    inputTokens: parseInteger(params.in),
    outputTokens: parseInteger(params.out),
    cacheWriteTokens: parseInteger(params.cw),
    cacheReadTokens: parseInteger(params.cr),
    cost: parseFloatValue(params.cost),
    title: params.title ?? "session",
    date: params.date ?? new Date().toISOString().split("T")[0],
    templateId: params.templateId ?? "default",
  };

  if (params.models) {
    try {
      const json = atob(params.models.replace(/-/g, "+").replace(/_/g, "/"));
      const decoded = JSON.parse(json) as ModelBreakdown[];
      data.models = decoded.map((item) => ({
        model: item.model ?? "unknown",
        in: parseInteger(String(item.in ?? 0)),
        out: parseInteger(String(item.out ?? 0)),
        cw: parseInteger(String(item.cw ?? 0)),
        cr: parseInteger(String(item.cr ?? 0)),
        cost: parseFloatValue(String(item.cost ?? 0)),
      }));
    } catch {
      // ignore malformed models param
    }
  }

  return normalizeReceiptData(data);
}

export function normalizeReceiptData(data: ReceiptData): ReceiptData {
  if (!data.models || data.models.length === 0) {
    return {
      ...data,
      inputTokens: Math.max(0, Math.round(data.inputTokens)),
      outputTokens: Math.max(0, Math.round(data.outputTokens)),
      cacheWriteTokens: Math.max(0, Math.round(data.cacheWriteTokens)),
      cacheReadTokens: Math.max(0, Math.round(data.cacheReadTokens)),
      cost: roundCurrency(Math.max(0, data.cost)),
    };
  }

  const totals = data.models.reduce(
    (acc, item) => {
      acc.inputTokens += Math.max(0, Math.round(item.in));
      acc.outputTokens += Math.max(0, Math.round(item.out));
      acc.cacheWriteTokens += Math.max(0, Math.round(item.cw));
      acc.cacheReadTokens += Math.max(0, Math.round(item.cr));
      acc.cost += Math.max(0, item.cost);
      return acc;
    },
    {
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      cost: 0,
    },
  );

  return {
    ...data,
    model: data.models.length === 1 ? data.models[0].model : data.model,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    cacheWriteTokens: totals.cacheWriteTokens,
    cacheReadTokens: totals.cacheReadTokens,
    cost: roundCurrency(totals.cost),
    models: data.models.map((item) => ({
      ...item,
      in: Math.max(0, Math.round(item.in)),
      out: Math.max(0, Math.round(item.out)),
      cw: Math.max(0, Math.round(item.cw)),
      cr: Math.max(0, Math.round(item.cr)),
      cost: roundCurrency(Math.max(0, item.cost)),
    })),
  };
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
