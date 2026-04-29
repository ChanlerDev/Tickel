# Tickel Development Conventions

## Release workflow

1. 实现功能，commit
2. 更新 `docs/CHANGELOG.md`：在对应版本下记录变更
3. 更新 `docs/ROADMAP.md`：已完成项标记 `[x]` 并移到 `## Done` 区域
4. bump `packages/cli/package.json` version
5. commit → tag → push tag → GitHub Action 自动 npm publish

## Roadmap 管理

- 新功能/修复计划加到 `docs/ROADMAP.md` 的 `## Planned`
- 完成后移到 `## Done`（保留历史，不删除）

## Commit 规范

Conventional Commits，只用 title，不写 body（除非 why 不明显）。
