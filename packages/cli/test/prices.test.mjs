import assert from "node:assert/strict";
import test from "node:test";

import pricesModule from "../dist/prices.js";

const { computeCost, resolvePricing, PRICES } = pricesModule;
const hasGeneratedPrices = Boolean(PRICES["gpt-4o"]);

test("computeCost resolves generated model ids from the official price table", { skip: !hasGeneratedPrices }, () => {
  assert.equal(computeCost("gpt-4o", 1_000_000, 1_000_000, 0, 0), 12.5);
});

test("computeCost resolves non-standard Claude Code model ids to official Anthropic ids", { skip: !hasGeneratedPrices }, () => {
  const cost = computeCost("claude-4.5-sonnet", 1_000, 100, 100, 200);
  assert.equal(cost, 0.004035);
});

test("computeCost accepts provider-scoped model keys", { skip: !hasGeneratedPrices }, () => {
  assert.equal(computeCost("anthropic/claude-sonnet-4-5", 1_000_000, 0, 0, 0), 3);
});

test("computeCost returns zero for unknown or ambiguous model ids", () => {
  assert.equal(computeCost("not-a-real-model", 1_000_000, 1_000_000, 0, 0), 0);
});

test("legacy PRICES export contains generated unique ids and manual overrides", { skip: !hasGeneratedPrices }, () => {
  assert.deepEqual(resolvePricing("claude-4.5-sonnet"), PRICES["claude-4.5-sonnet"]);
  assert.deepEqual(resolvePricing("gpt-4o"), PRICES["gpt-4o"]);
});
