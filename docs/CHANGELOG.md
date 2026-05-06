# Changelog

## Unreleased

- **feat**: 收据 URL 支持 v2 结构化 payload，表达 coding agent、模型明细、总量、费用和模板偏好，并保留旧 query 参数兼容
- **feat**: Web 收据页面支持手动编辑项目、日期、模板、agent、模型 token 和费用，导出 PNG 使用编辑后的收据

## 0.2.6

- **chore**: 同步官方模型价格表

- **feat**: 官方模型价格表同步 — 基于 models.dev 官方 provider allowlist 生成价格表快照，并支持定时同步 PR 与带 `release:patch` 标签的合并后自动发版

## 0.2.5

- **feat**: Claude Code sub-agent 用量 — session 收据会读取 `<session-id>/subagents/*.jsonl`，将 sub-agent token 按模型合并进小票明细和总费用

## 0.2.4

- **fix**: 子目录兼容 — 在项目子目录运行时，向上逐级查找 `~/.claude/projects/` 中匹配的 slug 目录，不再要求必须在会话启动目录运行

## 0.2.3

- **feat**: 多模型分账 — 单 session 内混合模型（如用户切换 opus→sonnet）时，CLI 和 Web 收据按模型分别展示 token 明细和费用

## 0.2.2

- **fix**: `tickel install` 使用 `${CLAUDE_SESSION_ID}` 内置变量精确定位当前会话，避免多会话时 mtime 匹配错误

## 0.2.1

- **fix**: `tickel today` 按运行机器本地日期统计 usage 行，修正 UTC 日期和跨午夜 session 归类问题

## 0.2.0

- **feat**: `tickel today` — 聚合当日所有项目的 session，按项目列出费用，显示汇总

## 0.1.2

- **fix**: 修正费用计算 — `input_tokens` 已包含 cache 部分，之前重复计费导致金额虚高
- **feat**: 无参数时自动查找当前项目目录最新 session（按 cwd 匹配 slug + mtime 排序）
- **feat**: 更新价格表，新增 claude-opus-4-7、claude-opus-4-6、claude-sonnet-4-6、claude-haiku-4-5，修正 opus-4-5 价格（$15→$5），同时支持 session 文件格式（`claude-4.6-opus`）和 API ID 格式
- **fix**: slash command 精简为 `tickel --print`，适配 Claude Code 内执行场景

## 0.1.1

- 首次发布
- CLI: 读取 session JSONL、计算 token 费用、打开浏览器收据页
- Web: 静态收据页（default / minimal 模板）+ PNG 下载
- `tickel install` 安装 `/tickel` slash command
