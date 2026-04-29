import { SessionUsage } from "./session.js";

const BASE_URL = "https://tickel.vercel.app";

export interface TickelParams {
  usage: SessionUsage;
  cost: number;
  templateId?: string;
}

export function buildUrl(params: TickelParams): string {
  const { usage, cost, templateId = "default" } = params;
  const p = new URLSearchParams({
    model: usage.model,
    in: String(usage.inputTokens),
    out: String(usage.outputTokens),
    cw: String(usage.cacheWriteTokens),
    cr: String(usage.cacheReadTokens),
    cost: cost.toFixed(4),
    title: usage.projectName,
    date: usage.date,
    templateId,
  });
  return `${BASE_URL}/?${p.toString()}`;
}
