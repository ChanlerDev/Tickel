#!/usr/bin/env node
import { Command } from "commander";
import { readSession } from "./session.js";
import { computeCost } from "./prices.js";
import { buildUrl } from "./url.js";

const program = new Command();

program
  .name("tickel")
  .description("Claude Code token receipt generator")
  .version("0.1.0");

program
  .command("session [sessionId]", { isDefault: true })
  .description("Generate receipt for a session (default: current session)")
  .option("-t, --template <id>", "Template ID", "default")
  .option("--print", "Print summary to terminal only, do not open browser")
  .action(async (sessionId: string | undefined, opts: { template: string; print: boolean }) => {
    const sid = sessionId ?? process.env.CLAUDE_SESSION_ID;
    if (!sid) {
      console.error("Error: no session ID. Pass one as argument or set $CLAUDE_SESSION_ID");
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
  .description("Aggregate all sessions from today")
  .option("--print", "Print summary only")
  .action(() => {
    console.log("tickel today — coming soon");
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

    const content = `Generate a Tickel token receipt for the current Claude Code session.

Run the following command:

\`\`\`bash
tickel
\`\`\`

This will read the current session's token usage, compute the cost, and open the receipt in your browser.
`;

    const dest = path.join(commandsDir, "tickel.md");
    fs.writeFileSync(dest, content, "utf-8");
    console.log(`✅ Installed /tickel slash command → ${dest}`);
  });

program.parse();
