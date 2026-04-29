import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface SessionUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheWriteTokens: number;
  cacheReadTokens: number;
  projectName: string;
  date: string; // YYYY-MM-DD
}

interface MessageEntry {
  type: string;
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  timestamp?: number | string;
}

export function formatLocalDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimestamp(timestamp: MessageEntry["timestamp"]): Date | null {
  if (timestamp === undefined) return null;

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findSessionFile(sessionId: string): { file: string; projectSlug: string } | null {
  const projectsDir = path.join(os.homedir(), ".claude", "projects");
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

function slugToProjectName(slug: string): string {
  // slug format: -Users-chanler-my-project → my-project
  const parts = slug.split("-").filter(Boolean);
  // Drop leading path components (Users, username), take last meaningful segment
  return parts[parts.length - 1] || slug;
}

function cwdToSlug(): string {
  // Convert cwd to Claude's slug format: /Users/chanler/personal/Tickel → -Users-chanler-personal-Tickel
  return process.cwd().replace(/\//g, "-");
}

export function findLatestSession(): string | null {
  const projectsDir = path.join(os.homedir(), ".claude", "projects");
  if (!fs.existsSync(projectsDir)) return null;

  const slug = cwdToSlug();
  const slugDir = path.join(projectsDir, slug);
  if (!fs.existsSync(slugDir)) return null;

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

export function readSession(sessionId: string): SessionUsage | null {
  const found = findSessionFile(sessionId);
  if (!found) return null;
  return parseSessionFile(found.file, found.projectSlug);
}

function parseSessionFile(file: string, projectSlug: string, dateFilter?: string): SessionUsage | null {
  const lines = fs.readFileSync(file, "utf-8").split("\n").filter(Boolean);

  let model = "unknown";
  let inputTokens = 0;
  let outputTokens = 0;
  let cacheWriteTokens = 0;
  let cacheReadTokens = 0;
  let firstTimestamp: Date | null = null;
  let hasUsage = false;

  for (const line of lines) {
    try {
      const entry: MessageEntry = JSON.parse(line);
      const timestamp = parseTimestamp(entry.timestamp);
      if (timestamp && !firstTimestamp) {
        firstTimestamp = timestamp;
      }
      const msg = entry.message;
      if (msg?.usage) {
        if (dateFilter && (!timestamp || formatLocalDate(timestamp) !== dateFilter)) {
          continue;
        }
        hasUsage = true;
        if (msg.model && msg.model !== "unknown") model = msg.model;
        inputTokens += msg.usage.input_tokens ?? 0;
        outputTokens += msg.usage.output_tokens ?? 0;
        cacheWriteTokens += msg.usage.cache_creation_input_tokens ?? 0;
        cacheReadTokens += msg.usage.cache_read_input_tokens ?? 0;
      }
    } catch {
      // skip malformed lines
    }
  }

  if (dateFilter && !hasUsage) return null;

  const date = dateFilter ?? formatLocalDate(firstTimestamp ?? new Date());

  return {
    model,
    inputTokens,
    outputTokens,
    cacheWriteTokens,
    cacheReadTokens,
    projectName: slugToProjectName(projectSlug),
    date,
  };
}

export function readTodaySessions(now = new Date()): SessionUsage[] {
  const projectsDir = path.join(os.homedir(), ".claude", "projects");
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

      const usage = parseSessionFile(filePath, slug, today);
      if (usage) {
        results.push(usage);
      }
    }
  }

  return results;
}
