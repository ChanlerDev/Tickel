# Changelog

## Unreleased

- **fix**: `tickel today` 按运行机器本地日期统计 usage 行，修正 UTC 日期和跨午夜 session 归类问题
- **fix**: `tickel install` 生成直接执行 `tickel --print` 的 Claude Code command 文件

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
