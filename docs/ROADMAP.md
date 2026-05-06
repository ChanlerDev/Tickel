# Roadmap

## Planned

- [ ] CodeBody 支持 — 兼容 CodeBody 的会话数据读取和用量统计
- [ ] 收据页面美化 — 调整 Web 收据模板样式
- [ ] README — GitHub repo 添加使用说明

## Done

- [x] Claude Code sub-agent 用量 — 读取 `<session-id>/subagents/*.jsonl` 并按模型平铺合并到小票总费用
- [x] 子目录兼容 — 在项目子目录运行时向上找 git root 匹配 slug
- [x] 多模型分账 — 单 session 内按模型分别统计 token 和费用，用户切模型时正确拆分
- [x] Slash command 精确会话定位 — 使用 `${CLAUDE_SESSION_ID}` 内置变量替代 mtime 查找，解决多会话场景错配问题 (0.2.2)
- [x] `tickel today` — 聚合当日所有 session 的 token 用量和费用 (0.2.0)
