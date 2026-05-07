// Known non-standard model ids emitted by local tools. Values must point to
// canonical provider/model ids from the generated models.dev price snapshot.
export const MODEL_ID_OVERRIDES: Record<string, string> = {
  // Anthropic Claude (dot instead of dash, short forms)
  "claude-4.7-opus": "anthropic/claude-opus-4-7",
  "claude-4.6-opus": "anthropic/claude-opus-4-6",
  "claude-4.6-sonnet": "anthropic/claude-sonnet-4-6",
  "claude-4.5-opus": "anthropic/claude-opus-4-5",
  "claude-4.5-sonnet": "anthropic/claude-sonnet-4-5",
  "claude-4.5-haiku": "anthropic/claude-haiku-4-5",
  "claude-4.1-opus": "anthropic/claude-opus-4-1",
  "claude-4.5": "anthropic/claude-opus-4-5",
  "claude-opus-4.7": "anthropic/claude-opus-4-7",
  "claude-opus-4.6": "anthropic/claude-opus-4-6",
  "claude-opus-4.5": "anthropic/claude-opus-4-5",
  "claude-sonnet-4.6": "anthropic/claude-sonnet-4-6",
  "claude-haiku-4.5": "anthropic/claude-haiku-4-5",

  // Google Gemini (short form → preview)
  "gemini-3.1-pro": "google/gemini-3.1-pro-preview",
  "gemini-3.0-flash": "google/gemini-3-flash-preview",
  "gemini-3.1-flash-lite": "google/gemini-3.1-flash-lite-preview",

  // Zhipu GLM (-ioa suffix variants)
  "glm-5.1-ioa": "zhipuai/glm-5.1",
  "glm-5.0-turbo-ioa": "zhipuai/glm-5",
  "glm-5v-turbo-ioa": "zhipuai/glm-5v-turbo",
  "glm-5.0-ioa": "zhipuai/glm-5",
  "glm-4.7-ioa": "zhipuai/glm-4.7",

  // MiniMax (lowercase + -ioa suffix variants)
  "minimax-m2.7-ioa": "minimax/MiniMax-M2.7",
  "minimax-m2.5-ioa": "minimax/MiniMax-M2.5",

  // Moonshot Kimi (-ioa suffix variants)
  "kimi-k2.6-ioa": "moonshotai/kimi-k2.6",
  "kimi-k2.5-ioa": "moonshotai/kimi-k2.5",

  // DeepSeek (custom VolcEngine variant → standard deepseek-v3)
  "deepseek-v3-2-volc-ioa": "deepseek/deepseek-v3",
};
