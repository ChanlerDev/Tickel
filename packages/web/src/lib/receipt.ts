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
}

export function parseReceiptParams(params: Record<string, string>): ReceiptData {
  return {
    model: params.model ?? "unknown",
    inputTokens: parseInt(params.in ?? "0", 10),
    outputTokens: parseInt(params.out ?? "0", 10),
    cacheWriteTokens: parseInt(params.cw ?? "0", 10),
    cacheReadTokens: parseInt(params.cr ?? "0", 10),
    cost: parseFloat(params.cost ?? "0"),
    title: params.title ?? "session",
    date: params.date ?? new Date().toISOString().split("T")[0],
    templateId: params.templateId ?? "default",
  };
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
