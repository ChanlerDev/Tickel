#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const VALID_LEVELS = new Set(["patch", "minor", "major"]);
const level = process.argv[2] ?? "patch";

function run(command, args, options = {}) {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });
}

function capture(command, args) {
  return execFileSync(command, args, { encoding: "utf8" }).trim();
}

function fail(message) {
  console.error(`agent:release: ${message}`);
  process.exit(1);
}

function latestReleaseTag() {
  const tags = capture("git", ["tag", "--list", "v*", "--sort=-version:refname"])
    .split("\n")
    .filter(Boolean);
  return tags[0] ?? null;
}

function changedFilesSince(tag) {
  if (!tag) return capture("git", ["ls-files"]).split("\n").filter(Boolean);
  return capture("git", ["diff", "--name-only", tag, "--"]).split("\n").filter(Boolean);
}

function bumpVersion(version, releaseLevel) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) fail(`unsupported package version: ${version}`);

  let [, major, minor, patch] = match.map(Number);
  if (releaseLevel === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (releaseLevel === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}

if (!VALID_LEVELS.has(level)) {
  fail("usage: pnpm agent:release [patch|minor|major]");
}

const status = capture("git", ["status", "--porcelain"]);
if (status) {
  fail("working tree must be clean before release; commit implementation and docs first");
}

const branch = capture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
if (branch === "HEAD") {
  fail("cannot release from detached HEAD");
}

const packagePath = path.join(process.cwd(), "packages", "cli", "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const latestTag = latestReleaseTag();

if (latestTag && latestTag !== `v${packageJson.version}`) {
  fail(`latest release tag ${latestTag} does not match package version ${packageJson.version}`);
}

const changedFiles = changedFilesSince(latestTag);
const hasCliChanges = changedFiles.some((file) => file.startsWith("packages/cli/"));
if (!hasCliChanges) {
  fail("no packages/cli changes since latest release tag");
}

const changelogPath = path.join(process.cwd(), "docs", "CHANGELOG.md");
const changelogContent = fs.readFileSync(changelogPath, "utf8");

// Extract content between ## Unreleased and next ## heading
const unreleasedMatch = changelogContent.match(
  /^## Unreleased\n([\s\S]*?)(?=^## |\Z)/m
);
const unreleasedBody = unreleasedMatch ? unreleasedMatch[1].trim() : "";

if (!unreleasedBody) {
  fail("## Unreleased section in docs/CHANGELOG.md is empty; add entries before release");
}

run("pnpm", ["agent:check"]);

const nextVersion = bumpVersion(packageJson.version, level);
const nextTag = `v${nextVersion}`;
const existingTags = capture("git", ["tag", "--list", nextTag]);
if (existingTags) {
  fail(`tag already exists: ${nextTag}`);
}

// Rewrite CHANGELOG: replace Unreleased block with versioned block, prepend empty Unreleased
const newChangelog = changelogContent.replace(
  /^## Unreleased\n[\s\S]*?(?=^## |\Z)/m,
  `## Unreleased\n\n## ${nextVersion}\n\n${unreleasedBody}\n\n`
);
fs.writeFileSync(changelogPath, newChangelog);

packageJson.version = nextVersion;
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

run("git", ["add", "packages/cli/package.json", changelogPath]);
run("git", ["commit", "-m", `chore(release): ${nextTag}`]);
run("git", ["tag", nextTag]);
run("git", ["push", "origin", `HEAD:${branch}`]);
run("git", ["push", "origin", nextTag]);

console.log(`\nReleased ${nextTag}`);
