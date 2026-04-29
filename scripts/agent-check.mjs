#!/usr/bin/env node
import { execFileSync } from "node:child_process";

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function run(command, args) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}

function latestReleaseTag() {
  const tags = git(["tag", "--list", "v*", "--sort=-version:refname"])
    .split("\n")
    .filter(Boolean);
  return tags[0] ?? null;
}

function changedFilesSince(tag) {
  const tracked = tag
    ? git(["diff", "--name-only", tag, "--"]).split("\n").filter(Boolean)
    : git(["ls-files"]).split("\n").filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"])
    .split("\n")
    .filter(Boolean);

  return [...new Set([...tracked, ...untracked])];
}

const tag = latestReleaseTag();
const files = changedFilesSince(tag);
const cliChanged = files.some((file) => file.startsWith("packages/cli/"));
const webChanged = files.some((file) => file.startsWith("packages/web/"));

console.log(tag ? `Checking changes since ${tag}` : "Checking all tracked files");

if (!cliChanged && !webChanged) {
  console.log("No package changes detected; skipping package verification.");
  process.exit(0);
}

if (cliChanged) {
  run("pnpm", ["test:cli"]);
}

if (webChanged) {
  run("pnpm", ["build:web"]);
}
