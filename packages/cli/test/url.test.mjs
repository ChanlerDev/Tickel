import assert from "node:assert/strict";
import test from "node:test";

import urlModule from "../dist/url.js";

const { buildUrl } = urlModule;

const usage = {
  model: "mixed",
  inputTokens: 300,
  outputTokens: 30,
  cacheWriteTokens: 40,
  cacheReadTokens: 50,
  projectName: "Tickel",
  date: "2026-05-06",
  models: [
    {
      model: "claude-sonnet-4-5",
      inputTokens: 100,
      outputTokens: 10,
      cacheWriteTokens: 20,
      cacheReadTokens: 30,
    },
    {
      model: "claude-haiku-4-5",
      inputTokens: 200,
      outputTokens: 20,
      cacheWriteTokens: 20,
      cacheReadTokens: 20,
    },
  ],
};

test("buildUrl includes a structured v2 receipt payload", () => {
  const url = new URL(buildUrl({ usage, cost: 0.1234, templateId: "ledger" }));
  const encoded = url.searchParams.get("payload");

  assert.ok(encoded);

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  assert.deepEqual(payload, {
    version: 2,
    source: {
      agent: "claude-code",
    },
    receipt: {
      title: "Tickel",
      date: "2026-05-06",
      templateId: "ledger",
      totalCost: 0.1234,
      totals: {
        inputTokens: 300,
        outputTokens: 30,
        cacheWriteTokens: 40,
        cacheReadTokens: 50,
      },
      items: [
        {
          agent: "claude-code",
          model: "claude-sonnet-4-5",
          inputTokens: 100,
          outputTokens: 10,
          cacheWriteTokens: 20,
          cacheReadTokens: 30,
          cost: 0.000384,
        },
        {
          agent: "claude-code",
          model: "claude-haiku-4-5",
          inputTokens: 200,
          outputTokens: 20,
          cacheWriteTokens: 20,
          cacheReadTokens: 20,
          cost: 0.00028700000000000004,
        },
      ],
    },
  });
});

test("buildUrl keeps legacy query params while adding v2 payload", () => {
  const url = new URL(buildUrl({ usage, cost: 0.1234, templateId: "minimal" }));

  assert.equal(url.searchParams.get("model"), "mixed");
  assert.equal(url.searchParams.get("in"), "300");
  assert.equal(url.searchParams.get("out"), "30");
  assert.equal(url.searchParams.get("cw"), "40");
  assert.equal(url.searchParams.get("cr"), "50");
  assert.equal(url.searchParams.get("cost"), "0.1234");
  assert.equal(url.searchParams.get("title"), "Tickel");
  assert.equal(url.searchParams.get("date"), "2026-05-06");
  assert.equal(url.searchParams.get("templateId"), "minimal");
  assert.ok(url.searchParams.get("models"));
  assert.ok(url.searchParams.get("payload"));
});
