import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SessionUsage, ModelUsage, formatLocalDate } from "./session.js";

/**
 * CodeBuddy session reader
 * CodeBuddy stores sessions at ~/.codebuddy/projects/<slug>/<session-id>.jsonl
 * Subagents are at ~/.codebuddy/projects/<slug>/<session-id>/subagents/agent-<id>.jsonl
 *
 * JSONL format uses providerData.rawUsage.* for token counts:
 * - providerData.rawUsage.prompt_tokens → input_tokens
 * - providerData.rawUsage.completion_tokens → output_tokens
 * - providerData.rawUsage.cache_creation_input_tokens → cache_write_tokens
 * - providerData.rawUsage.cache_read_input_tokens → cache_read_tokens
 * - providerData.model or providerData.rawUsage.model → model name
 */

interface CodeBuddyMessageEntry {
  timestamp?: number | string;
  message?: {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  providerData?: {
    model?: string;
    rawUsage?: {
      model?: string;
      prompt_tokens?: number;
      completion_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

function slugToProjectName(slug: string): string {
  const parts = slug.split("-").filter(Boolean);
  return parts[parts.length - 1] || slug;
}

function dirToSlug(dir: string): string {
  return dir.replace(/\//g, "-");
}

function findProjectSlugDir(projectsDir: string): string | null {
  let current = process.cwd();
  while (true) {
    const slugDir = path.join(projectsDir, dirToSlug(current));
    if (fs.existsSync(slugDir)) return slugDir;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function parseTimestamp(timestamp: CodeBuddyMessageEntry["timestamp"]): Date | null {
  if (timestamp === undefined) return null;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findCodeBuddySessionFile(sessionId: string): { file: string; projectSlug: string } | null {
  const projectsDir = path.join(os.homedir(), ".codebuddy", "projects");
  if (!fs.existsSync(projectsDir)) return null;

  const slugs = fs.readdirSync(projectsDir);
  for (const slug of slugs) {
    const candidate = path.join(projectsDir, slug, `${sessionId}.jsonl`);
    if (fs.existsSync(candidate)) {
      return { file: candidate, projectSlug: slug };
    }
  }
  return null;
}

function parseCodeBuddySessionFile(
  file: string,
  projectSlug: string,
  dateFilter?: string
): SessionUsage | null {
  const modelMap = new Map<string, ModelUsage>();
  let firstTimestamp: Date | null = null;
  let hasUsage = false;

  function addEntry(entry: CodeBuddyMessageEntry): void {
    const timestamp = parseTimestamp(entry.timestamp);
    if (timestamp && !firstTimestamp) {
      firstTimestamp = timestamp;
    }

    // Prefer providerData.rawUsage, fallback to message.usage
    const rawUsage = entry.providerData?.rawUsage;
    const msgUsage = entry.message?.usage;

    const inTok = rawUsage?.prompt_tokens ?? msgUsage?.input_tokens ?? 0;
    const outTok = rawUsage?.completion_tokens ?? msgUsage?.output_tokens ?? 0;
    const cwTok = rawUsage?.cache_creation_input_tokens ?? msgUsage?.cache_creation_input_tokens ?? 0;
    const crTok = rawUsage?.cache_read_input_tokens ?? msgUsage?.cache_read_input_tokens ?? 0;

    // Skip if no usage data
    if (inTok === 0 && outTok === 0 && cwTok === 0 && crTok === 0) return;

    if (dateFilter && (!timestamp || formatLocalDate(timestamp) !== dateFilter)) {
      return;
    }

    // Get model name from providerData.rawUsage.model or providerData.model
    let msgModel: string | null = null;
    if (rawUsage?.model && rawUsage.model !== "unknown" && rawUsage.model !== "<synthetic>") {
      msgModel = rawUsage.model;
    } else if (entry.providerData?.model && entry.providerData.model !== "unknown" && entry.providerData.model !== "<synthetic>") {
      msgModel = entry.providerData.model;
    }

    if (!msgModel) return;

    hasUsage = true;
    const existing = modelMap.get(msgModel);

    if (existing) {
      existing.inputTokens += inTok;
      existing.outputTokens += outTok;
      existing.cacheWriteTokens += cwTok;
      existing.cacheReadTokens += crTok;
    } else {
      modelMap.set(msgModel, {
        model: msgModel,
        inputTokens: inTok,
        outputTokens: outTok,
        cacheWriteTokens: cwTok,
        cacheReadTokens: crTok,
      });
    }
  }

  function addJsonlFile(jsonlFile: string): void {
    const content = fs.readFileSync(jsonlFile, "utf-8");
    const lines = content.split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        addEntry(JSON.parse(line) as CodeBuddyMessageEntry);
      } catch {
        // skip malformed lines
      }
    }
  }

  addJsonlFile(file);

  // Process subagents
  const sessionId = path.basename(file, ".jsonl");
  const subagentsDir = path.join(path.dirname(file), sessionId, "subagents");
  if (fs.existsSync(subagentsDir) && fs.statSync(subagentsDir).isDirectory()) {
    const subagentFiles = fs.readdirSync(subagentsDir)
      .filter(f => f.endsWith(".jsonl"))
      .sort();
    for (const subagentFile of subagentFiles) {
      addJsonlFile(path.join(subagentsDir, subagentFile));
    }
  }

  if (dateFilter && !hasUsage) return null;

  const models = Array.from(modelMap.values());
  const date = dateFilter ?? formatLocalDate(firstTimestamp ?? new Date());

  // Compute totals
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  for (const m of models) {
    inputTokens += m.inputTokens;
    outputTokens += m.outputTokens;
    cacheWriteTokens += m.cacheWriteTokens;
    cacheReadTokens += m.cacheReadTokens;
  }

  const model = models.length === 1 ? models[0].model
    : models.length > 1 ? "mixed"
    : "unknown";

  return {
    model,
    inputTokens,
    outputTokens,
    cacheWriteTokens,
    cacheReadTokens,
    projectName: slugToProjectName(projectSlug),
    date,
    models,
  };
}

/**
 * Read a single CodeBuddy session by ID
 * @param sessionId - The session ID (filename without .jsonl extension)
 * @returns SessionUsage or null if not found
 */
export function readCodeBuddySession(sessionId: string): SessionUsage | null {
  const found = findCodeBuddySessionFile(sessionId);
  if (!found) return null;
  return parseCodeBuddySessionFile(found.file, found.projectSlug);
}

/**
 * Find the most recently modified CodeBuddy session in the current project
 * @returns Session ID or null if no sessions found
 */
export function findLatestCodeBuddySession(): string | null {
  const projectsDir = path.join(os.homedir(), ".codebuddy", "projects");
  if (!fs.existsSync(projectsDir)) return null;

  const slugDir = findProjectSlugDir(projectsDir);
  if (!slugDir) return null;

  const files = fs.readdirSync(slugDir)
    .filter(f => f.endsWith(".jsonl"))
    .map(f => ({
      name: f,
      mtime: fs.statSync(path.join(slugDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) return null;
  return files[0].name.replace(".jsonl", "");
}

/**
 * Read all CodeBuddy sessions modified today
 * @returns Array of SessionUsage objects
 */
export function readTodayCodeBuddySessions(now = new Date()): SessionUsage[] {
  const projectsDir = path.join(os.homedir(), ".codebuddy", "projects");
  if (!fs.existsSync(projectsDir)) return [];

  const today = formatLocalDate(now);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const results: SessionUsage[] = [];

  const slugs = fs.readdirSync(projectsDir);
  for (const slug of slugs) {
    const slugDir = path.join(projectsDir, slug);
    if (!fs.statSync(slugDir).isDirectory()) continue;

    const files = fs.readdirSync(slugDir).filter(f => f.endsWith(".jsonl"));
    for (const file of files) {
      const filePath = path.join(slugDir, file);
      // Quick filter: skip files not modified today
      const mtime = fs.statSync(filePath).mtimeMs;
      if (mtime < todayStart) continue;

      const usage = parseCodeBuddySessionFile(filePath, slug, today);
      if (usage) {
        results.push(usage);
      }
    }
  }

  return results;
}
