#!/usr/bin/env node
import { Command } from "commander";
import { readSession, findLatestSession, readTodaySessions } from "./session.js";
import { computeCost } from "./prices.js";
import { buildUrl } from "./url.js";

const program = new Command();

program
  .name("tickel")
  .description("Claude Code token receipt generator")
  .version("0.1.1");

program
  .command("session [sessionId]", { isDefault: true })
  .description("Generate receipt for a session (default: latest session in cwd project)")
  .option("-t, --template <id>", "Template ID", "default")
  .option("--print", "Print summary to terminal only, do not open browser")
  .action(async (sessionId: string | undefined, opts: { template: string; print: boolean }) => {
    const sid = sessionId ?? findLatestSession();
    if (!sid) {
      console.error("Error: no session found. Pass a session ID or run from a Claude Code project directory.");
      process.exit(1);
    }

    const usage = readSession(sid);
    if (!usage) {
      console.error(`Error: session file not found for ID ${sid}`);
      process.exit(1);
    }

    const cost = computeCost(
      usage.model,
      usage.inputTokens,
      usage.outputTokens,
      usage.cacheWriteTokens,
      usage.cacheReadTokens
    );

    console.log(`\n🧾 Tickel — ${usage.projectName} (${usage.date})`);
    console.log(`   Model:        ${usage.model}`);
    console.log(`   Input:        ${usage.inputTokens.toLocaleString()} tokens`);
    console.log(`   Output:       ${usage.outputTokens.toLocaleString()} tokens`);
    console.log(`   Cache write:  ${usage.cacheWriteTokens.toLocaleString()} tokens`);
    console.log(`   Cache read:   ${usage.cacheReadTokens.toLocaleString()} tokens`);
    console.log(`   Cost:         $${cost.toFixed(4)}`);

    if (!opts.print) {
      // open@10 is ESM-only; use dynamic import for CJS compatibility
      const { default: open } = await import("open");
      const url = buildUrl({ usage, cost, templateId: opts.template });
      console.log(`\n   Opening receipt: ${url}\n`);
      await open(url);
    }
  });

program
  .command("today")
  .description("Aggregate all sessions from today across all projects")
  .option("--print", "Print summary only")
  .action(async (opts: { print: boolean }) => {
    const sessions = readTodaySessions();
    if (sessions.length === 0) {
      console.log("\nNo sessions found for today.");
      return;
    }

    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheWrite = 0;
    let totalCacheRead = 0;
    let totalCost = 0;

    const today = new Date().toISOString().split("T")[0];
    console.log(`\n🧾 Tickel — Today (${today})`);
    console.log(`   ${sessions.length} session(s)\n`);

    for (const s of sessions) {
      const cost = computeCost(s.model, s.inputTokens, s.outputTokens, s.cacheWriteTokens, s.cacheReadTokens);
      totalInput += s.inputTokens;
      totalOutput += s.outputTokens;
      totalCacheWrite += s.cacheWriteTokens;
      totalCacheRead += s.cacheReadTokens;
      totalCost += cost;
      console.log(`   ${s.projectName.padEnd(20)} ${s.model.padEnd(22)} $${cost.toFixed(4)}`);
    }

    console.log(`\n   ${"─".repeat(50)}`);
    console.log(`   Input:        ${totalInput.toLocaleString()} tokens`);
    console.log(`   Output:       ${totalOutput.toLocaleString()} tokens`);
    console.log(`   Cache write:  ${totalCacheWrite.toLocaleString()} tokens`);
    console.log(`   Cache read:   ${totalCacheRead.toLocaleString()} tokens`);
    console.log(`   Total cost:   $${totalCost.toFixed(4)}\n`);

    if (!opts.print) {
      // Build URL with aggregated totals, use "today" as title
      const aggregated = {
        model: "mixed",
        inputTokens: totalInput,
        outputTokens: totalOutput,
        cacheWriteTokens: totalCacheWrite,
        cacheReadTokens: totalCacheRead,
        projectName: "today",
        date: today,
      };
      const { default: open } = await import("open");
      const url = buildUrl({ usage: aggregated, cost: totalCost });
      console.log(`   Opening receipt: ${url}\n`);
      await open(url);
    }
  });

program
  .command("install")
  .description("Install /tickel slash command for Claude Code")
  .action(() => {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");

    const commandsDir = path.join(os.homedir(), ".claude", "commands");
    fs.mkdirSync(commandsDir, { recursive: true });

    const content = `Run tickel to show token usage and cost for the current session:

\`\`\`bash
tickel --print
\`\`\`
`;

    const dest = path.join(commandsDir, "tickel.md");
    fs.writeFileSync(dest, content, "utf-8");
    console.log(`✅ Installed /tickel slash command → ${dest}`);
  });

program.parse();
