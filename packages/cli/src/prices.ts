export interface ModelPricing {
  input: number;       // USD per 1M tokens
  output: number;
  cache_write: number;
  cache_read: number;
}

export const PRICES: Record<string, ModelPricing> = {
  // Claude 4 series
  "claude-opus-4-5":    { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
  "claude-sonnet-4-5":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  // Claude 3.7 / 3.5 series
  "claude-sonnet-3-7":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-sonnet-3-5":  { input: 3.00,  output: 15.00,  cache_write: 3.75,  cache_read: 0.30 },
  "claude-haiku-3-5":   { input: 0.80,  output: 4.00,   cache_write: 1.00,  cache_read: 0.08 },
  "claude-opus-3":      { input: 15.00, output: 75.00,  cache_write: 18.75, cache_read: 1.50 },
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
  return (
    (inputTokens / M) * pricing.input +
    (outputTokens / M) * pricing.output +
    (cacheWriteTokens / M) * pricing.cache_write +
    (cacheReadTokens / M) * pricing.cache_read
  );
}
