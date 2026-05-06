// Known non-standard model ids emitted by local tools. Values must point to
// canonical provider/model ids from the generated models.dev price snapshot.
export const MODEL_ID_OVERRIDES: Record<string, string> = {
  "claude-4.7-opus": "anthropic/claude-opus-4-7",
  "claude-4.6-opus": "anthropic/claude-opus-4-6",
  "claude-4.6-sonnet": "anthropic/claude-sonnet-4-6",
  "claude-4.5-opus": "anthropic/claude-opus-4-5",
  "claude-4.5-sonnet": "anthropic/claude-sonnet-4-5",
  "claude-4.5-haiku": "anthropic/claude-haiku-4-5",
  "claude-4.1-opus": "anthropic/claude-opus-4-1",
};
