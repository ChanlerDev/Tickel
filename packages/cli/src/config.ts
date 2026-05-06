import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

export interface TickelConfig {
  templateId?: string;
  webUrl?: string;
  agent?: string;
}

export interface ExplicitOptions {
  templateId?: string;
  webUrl?: string;
  agent?: string;
}

const DEFAULT_CONFIG: Required<TickelConfig> = {
  templateId: "default",
  webUrl: "https://tickel.vercel.app",
  agent: "claude-code",
};

export function getConfigPath(): string {
  return path.join(os.homedir(), ".config", "tickel", "config.json");
}

export function loadConfig(): TickelConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as TickelConfig;
    return sanitizeConfig(parsed);
  } catch {
    return {};
  }
}

export function saveConfig(config: TickelConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(sanitizeConfig(config), null, 2)}\n`, "utf8");
}

export function resolveOptions(config: TickelConfig, explicit: ExplicitOptions = {}): Required<TickelConfig> {
  return {
    templateId: explicit.templateId ?? config.templateId ?? DEFAULT_CONFIG.templateId,
    webUrl: explicit.webUrl ?? config.webUrl ?? DEFAULT_CONFIG.webUrl,
    agent: explicit.agent ?? config.agent ?? DEFAULT_CONFIG.agent,
  };
}

export async function promptConfig(current = loadConfig()): Promise<TickelConfig> {
  const resolved = resolveOptions(current);
  const rl = readline.createInterface({ input, output });

  try {
    const templateId = await ask(rl, "Default template", resolved.templateId);
    const webUrl = await ask(rl, "Web URL", resolved.webUrl);
    const agent = await ask(rl, "Default agent", resolved.agent);
    return sanitizeConfig({ templateId, webUrl, agent });
  } finally {
    rl.close();
  }
}

function sanitizeConfig(config: TickelConfig): TickelConfig {
  const next: TickelConfig = {};
  if (isNonEmptyString(config.templateId)) next.templateId = config.templateId.trim();
  if (isNonEmptyString(config.webUrl)) next.webUrl = normalizeWebUrl(config.webUrl);
  if (isNonEmptyString(config.agent)) next.agent = config.agent.trim();
  return next;
}

function normalizeWebUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    return new URL(trimmed).toString().replace(/\/+$/, "");
  } catch {
    return DEFAULT_CONFIG.webUrl;
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function ask(rl: readline.Interface, label: string, defaultValue: string): Promise<string> {
  const answer = await rl.question(`${label} (${defaultValue}): `);
  return answer.trim() || defaultValue;
}
