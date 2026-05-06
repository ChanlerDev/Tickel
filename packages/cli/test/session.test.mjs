import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sessionModule from "../dist/session.js";

const { formatLocalDate, readSession, readTodaySessions } = sessionModule;

function writeJsonl(file, entries) {
  fs.writeFileSync(file, entries.map((entry) => JSON.stringify(entry)).join("\n") + "\n");
}

test("formatLocalDate uses local calendar date", () => {
  assert.equal(formatLocalDate(new Date(2026, 3, 30, 1, 30)), "2026-04-30");
});

test("readTodaySessions aggregates usage entries from the local day", (t) => {
  const originalHome = process.env.HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "tickel-"));
  t.after(() => {
    process.env.HOME = originalHome;
    fs.rmSync(home, { recursive: true, force: true });
  });
  process.env.HOME = home;

  const projectDir = path.join(home, ".claude", "projects", "-Users-test-Project");
  fs.mkdirSync(projectDir, { recursive: true });
  const sessionFile = path.join(projectDir, "session-1.jsonl");

  writeJsonl(sessionFile, [
    {
      type: "assistant",
      timestamp: new Date(2026, 3, 29, 23, 50).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 100,
          output_tokens: 10,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    },
    {
      type: "assistant",
      timestamp: new Date(2026, 3, 30, 0, 10).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 200,
          output_tokens: 20,
          cache_creation_input_tokens: 30,
          cache_read_input_tokens: 40,
        },
      },
    },
  ]);
  const subagentsDir = path.join(projectDir, "session-1", "subagents");
  fs.mkdirSync(subagentsDir, { recursive: true });
  writeJsonl(path.join(subagentsDir, "agent-a.jsonl"), [
    {
      type: "assistant",
      isSidechain: true,
      timestamp: new Date(2026, 3, 29, 23, 55).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 300,
          output_tokens: 30,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    },
    {
      type: "assistant",
      isSidechain: true,
      timestamp: new Date(2026, 3, 30, 0, 15).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 50,
          output_tokens: 5,
          cache_creation_input_tokens: 6,
          cache_read_input_tokens: 7,
        },
      },
    },
  ]);

  const todayMtime = new Date(2026, 3, 30, 0, 20);
  fs.utimesSync(sessionFile, todayMtime, todayMtime);

  const sessions = readTodaySessions(new Date(2026, 3, 30, 12));

  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0], {
    model: "claude-sonnet-4-5",
    inputTokens: 250,
    outputTokens: 25,
    cacheWriteTokens: 36,
    cacheReadTokens: 47,
    projectName: "Project",
    date: "2026-04-30",
    models: [
      {
        model: "claude-sonnet-4-5",
        inputTokens: 250,
        outputTokens: 25,
        cacheWriteTokens: 36,
        cacheReadTokens: 47,
      },
    ],
  });
});

test("readSession includes sub-agent usage in the per-model breakdown", (t) => {
  const originalHome = process.env.HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "tickel-"));
  t.after(() => {
    process.env.HOME = originalHome;
    fs.rmSync(home, { recursive: true, force: true });
  });
  process.env.HOME = home;

  const projectDir = path.join(home, ".claude", "projects", "-Users-test-Project");
  fs.mkdirSync(projectDir, { recursive: true });
  writeJsonl(path.join(projectDir, "session-1.jsonl"), [
    {
      type: "assistant",
      timestamp: new Date(2026, 3, 30, 10, 0).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 100,
          output_tokens: 10,
          cache_creation_input_tokens: 20,
          cache_read_input_tokens: 30,
        },
      },
    },
  ]);

  const subagentsDir = path.join(projectDir, "session-1", "subagents");
  fs.mkdirSync(subagentsDir, { recursive: true });
  writeJsonl(path.join(subagentsDir, "agent-a.jsonl"), [
    {
      type: "assistant",
      isSidechain: true,
      timestamp: new Date(2026, 3, 30, 10, 5).toISOString(),
      message: {
        model: "claude-haiku-4-5",
        usage: {
          input_tokens: 50,
          output_tokens: 5,
          cache_creation_input_tokens: 10,
          cache_read_input_tokens: 15,
        },
      },
    },
  ]);
  writeJsonl(path.join(subagentsDir, "agent-b.jsonl"), [
    {
      type: "assistant",
      isSidechain: true,
      timestamp: new Date(2026, 3, 30, 10, 10).toISOString(),
      message: {
        model: "claude-sonnet-4-5",
        usage: {
          input_tokens: 25,
          output_tokens: 2,
          cache_creation_input_tokens: 3,
          cache_read_input_tokens: 4,
        },
      },
    },
  ]);

  const usage = readSession("session-1");

  assert.deepEqual(usage, {
    model: "mixed",
    inputTokens: 175,
    outputTokens: 17,
    cacheWriteTokens: 33,
    cacheReadTokens: 49,
    projectName: "Project",
    date: "2026-04-30",
    models: [
      {
        model: "claude-sonnet-4-5",
        inputTokens: 125,
        outputTokens: 12,
        cacheWriteTokens: 23,
        cacheReadTokens: 34,
      },
      {
        model: "claude-haiku-4-5",
        inputTokens: 50,
        outputTokens: 5,
        cacheWriteTokens: 10,
        cacheReadTokens: 15,
      },
    ],
  });
});
