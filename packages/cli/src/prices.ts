import type { ModelUsage } from "./session.js";

export interface ModelPricing {
  input: number;       // USD per 1M tokens
  output: number;
  cache_write: number;
  cache_read: number;
}

export const PRICES: Record<string, ModelPricing> = {
  // Claude Opus 4.7
  "claude-opus-4-7":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  "claude-4.7-opus":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  // Claude Opus 4.6
  "claude-opus-4-6":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  "claude-4.6-opus":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  // Claude Sonnet 4.6
  "claude-sonnet-4-6":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-4.6-sonnet":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  // Claude Opus 4.5
  "claude-opus-4-5":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  "claude-4.5-opus":    { input: 5.00,  output: 25.00,  cache_write: 6.25,  cache_read: 0.50 },
  // Claude Sonnet 4.5
  "claude-sonnet-4-5":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-4.5-sonnet":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  // Claude Opus 4.1
  "claude-opus-4-1":    { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
  "claude-4.1-opus":    { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
  // Claude Sonnet 4 / Opus 4
  "claude-sonnet-4-0":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-opus-4-0":    { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
  // Claude Haiku 4.5
  "claude-haiku-4-5":   { input: 1.00,  output: 5.00,   cache_write: 1.25,  cache_read: 0.10 },
  "claude-4.5-haiku":   { input: 1.00,  output: 5.00,   cache_write: 1.25,  cache_read: 0.10 },
  // Claude 3.x series
  "claude-sonnet-3-7":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-sonnet-3-5":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-haiku-3-5":   { input: 0.80,  output: 4.00,   cache_write: 1.00,  cache_read: 0.08 },
  "claude-opus-3":      { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
  "claude-haiku-3":     { input: 0.25,  output: 1.25,   cache_write: 0.30,  cache_read: 0.025 },
  // GPT-4o series
  "gpt-4o":             { input: 2.50,  output: 10.00,  cache_write: 0,     cache_read: 1.25 },
  "gpt-4o-mini":        { input: 0.15,  output: 0.60,   cache_write: 0,     cache_read: 0.075 },
  // Gemini
  "gemini-2.0-flash":   { input: 0.10,  output: 0.40,   cache_write: 0,     cache_read: 0.025 },
  "gemini-1.5-pro":     { input: 1.25,  output: 5.00,   cache_write: 0,     cache_read: 0.3125 },
};

export function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheWriteTokens: number,
  cacheReadTokens: number
): number {
  const pricing = PRICES[model];
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
