import { SessionUsage } from "./session.js";
import { computeCostByModel } from "./prices.js";

const BASE_URL = "https://tickel.vercel.app";
const DEFAULT_AGENT = "claude-code";

export interface TickelParams {
  usage: SessionUsage;
  cost: number;
  templateId?: string;
  webUrl?: string;
  agent?: string;
}

export function buildUrl(params: TickelParams): string {
  const { usage, cost, templateId = "default", webUrl = BASE_URL, agent = DEFAULT_AGENT } = params;
  const modelBreakdown = buildModelBreakdown(usage);
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
    const breakdown = modelBreakdown.map(m => ({
      model: m.model,
      in: m.inputTokens,
      out: m.outputTokens,
      cw: m.cacheWriteTokens,
      cr: m.cacheReadTokens,
      cost: m.cost,
    }));
    const encoded = Buffer.from(JSON.stringify(breakdown)).toString("base64url");
    p.set("models", encoded);
  }

  p.set("payload", encodePayload({
    version: 2,
    source: {
      agent,
    },
    receipt: {
      title: usage.projectName,
      date: usage.date,
      templateId,
      totalCost: Number(cost.toFixed(4)),
      totals: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheWriteTokens: usage.cacheWriteTokens,
        cacheReadTokens: usage.cacheReadTokens,
      },
      items: modelBreakdown.map(m => ({
        agent,
        model: m.model,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cacheWriteTokens: m.cacheWriteTokens,
        cacheReadTokens: m.cacheReadTokens,
        cost: m.cost,
      })),
    },
  }));

  const url = new URL(webUrl);
  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  url.search = p.toString();
  return url.toString();
}

interface UrlModelBreakdown {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  cost: number;
}

function buildModelBreakdown(usage: SessionUsage): UrlModelBreakdown[] {
  const modelCosts = computeCostByModel(usage.models);
  return usage.models.map(m => {
    const cost = modelCosts.find(c => c.model === m.model)?.cost ?? 0;
    return {
      model: m.model,
      inputTokens: m.inputTokens,
      outputTokens: m.outputTokens,
      cacheWriteTokens: m.cacheWriteTokens,
      cacheReadTokens: m.cacheReadTokens,
      cost,
    };
  });
}

function encodePayload(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
