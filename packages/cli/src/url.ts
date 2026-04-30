import { SessionUsage } from "./session.js";
import { computeCostByModel } from "./prices.js";

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

  // Encode per-model breakdown for multi-model sessions
  if (usage.models.length > 1) {
    const modelCosts = computeCostByModel(usage.models);
    const breakdown = usage.models.map(m => {
      const mc = modelCosts.find(c => c.model === m.model)!;
      return {
        model: m.model,
        in: m.inputTokens,
        out: m.outputTokens,
        cw: m.cacheWriteTokens,
        cr: m.cacheReadTokens,
        cost: mc.cost,
      };
    });
    const encoded = Buffer.from(JSON.stringify(breakdown)).toString("base64url");
    p.set("models", encoded);
  }

  return `${BASE_URL}/?${p.toString()}`;
}
