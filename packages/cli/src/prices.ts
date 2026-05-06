import type { ModelUsage } from "./session.js";
import { GENERATED_MODEL_PRICES, MODEL_ID_INDEX } from "./generated/prices.js";
import { MODEL_ID_OVERRIDES } from "./model-overrides.js";

export interface ModelPricing {
  input: number;       // USD per 1M tokens
  output: number;
  cache_write: number;
  cache_read: number;
}

export const PRICES: Record<string, ModelPricing> = buildLegacyPriceIndex();

function buildLegacyPriceIndex(): Record<string, ModelPricing> {
  const prices: Record<string, ModelPricing> = {};

  for (const [modelId, providerKeys] of Object.entries(MODEL_ID_INDEX)) {
    if (providerKeys.length === 1) {
      const pricing = GENERATED_MODEL_PRICES[providerKeys[0]];
      const normalized = toModelPricing(pricing);
      if (normalized) prices[modelId] = normalized;
    }
  }

  for (const override of Object.keys(MODEL_ID_OVERRIDES)) {
    const pricing = resolvePricing(override);
    if (pricing) prices[override] = pricing;
  }

  return prices;
}

export function resolvePricing(model: string): ModelPricing | null {
  const overrideKey = MODEL_ID_OVERRIDES[model];
  if (overrideKey) {
    return toModelPricing(GENERATED_MODEL_PRICES[overrideKey]);
  }

  const providerScoped = GENERATED_MODEL_PRICES[model];
  if (providerScoped) {
    return toModelPricing(providerScoped);
  }

  const providerKeys = MODEL_ID_INDEX[model];
  if (!providerKeys || providerKeys.length !== 1) {
    return null;
  }

  return toModelPricing(GENERATED_MODEL_PRICES[providerKeys[0]]);
}

function toModelPricing(pricing: ModelPricing | undefined): ModelPricing | null {
  if (!pricing) return null;
  return {
    input: pricing.input,
    output: pricing.output,
    cache_write: pricing.cache_write,
    cache_read: pricing.cache_read,
  };
}

export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number,
  cacheReadTokens: number
): number {
  const pricing = resolvePricing(model);
  if (!pricing) return 0;
  const M = 1_000_000;
  // input_tokens already includes cache_write + cache_read,
  // so base input = total input - cache portions
  const baseInputTokens = Math.max(0, inputTokens - cacheWriteTokens - cacheReadTokens);
  return (
    (baseInputTokens / M) * pricing.input +
    (outputTokens / M) * pricing.output +
    (cacheWriteTokens / M) * pricing.cache_write +
    (cacheReadTokens / M) * pricing.cache_read
  );
}

export interface ModelCost {
  model: string;
  cost: number;
}

export function computeCostByModel(models: ModelUsage[]): ModelCost[] {
  return models.map(m => ({
    model: m.model,
    cost: computeCost(m.model, m.inputTokens, m.outputTokens, m.cacheWriteTokens, m.cacheReadTokens),
  }));
}
