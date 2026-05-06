import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import configModule from "../dist/config.js";

const { getConfigPath, loadConfig, saveConfig, resolveOptions } = configModule;

test("config reads and writes ~/.config/tickel/config.json", (t) => {
  const originalHome = process.env.HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "tickel-config-"));
  t.after(() => {
    process.env.HOME = originalHome;
    fs.rmSync(home, { recursive: true, force: true });
  });
  process.env.HOME = home;

  assert.equal(getConfigPath(), path.join(home, ".config", "tickel", "config.json"));
  assert.deepEqual(loadConfig(), {});

  saveConfig({ templateId: "ledger", webUrl: "http://localhost:3000", agent: "codebuddy" });

  assert.deepEqual(loadConfig(), {
    templateId: "ledger",
    webUrl: "http://localhost:3000",
    agent: "codebuddy",
  });
});

test("resolveOptions gives explicit CLI values priority over config", () => {
  assert.deepEqual(
    resolveOptions(
      { templateId: "minimal", webUrl: "https://configured.example", agent: "codebuddy" },
      { templateId: "ledger" },
    ),
    {
      templateId: "ledger",
      webUrl: "https://configured.example",
      agent: "codebuddy",
    },
  );
});

test("loadConfig ignores malformed config files", (t) => {
  const originalHome = process.env.HOME;
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "tickel-config-"));
  t.after(() => {
    process.env.HOME = originalHome;
    fs.rmSync(home, { recursive: true, force: true });
  });
  process.env.HOME = home;

  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true });
  fs.writeFileSync(getConfigPath(), "{bad json", "utf8");

  assert.deepEqual(loadConfig(), {});
});
