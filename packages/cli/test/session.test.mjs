import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import sessionModule from "../dist/session.js";

const { formatLocalDate, readTodaySessions } = sessionModule;

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

  const todayMtime = new Date(2026, 3, 30, 0, 20);
  fs.utimesSync(sessionFile, todayMtime, todayMtime);

  const sessions = readTodaySessions(new Date(2026, 3, 30, 12));

  assert.equal(sessions.length, 1);
  assert.deepEqual(sessions[0], {
    model: "claude-sonnet-4-5",
    inputTokens: 200,
    outputTokens: 20,
    cacheWriteTokens: 30,
    cacheReadTokens: 40,
    projectName: "Project",
    date: "2026-04-30",
    models: [
      {
        model: "claude-sonnet-4-5",
        inputTokens: 200,
        outputTokens: 20,
        cacheWriteTokens: 30,
        cacheReadTokens: 40,
      },
    ],
  });
});
