# Roadmap

## Planned

- [ ] CodeBody 支持 — 兼容 CodeBody 的会话数据读取和用量统计
- [ ] Slash command 执行语义 — `/tickel` 经过模型回复，无法完全绕过（Claude Code 设计限制）；已改用 `${CLAUDE_SESSION_ID}` 精确定位会话
- [ ] 子目录兼容 — 在项目子目录运行时向上找 git root 匹配 slug
- [ ] 收据页面美化 — 调整 Web 收据模板样式
- [ ] README — GitHub repo 添加使用说明

## Done

- [x] `tickel today` — 聚合当日所有 session 的 token 用量和费用 (0.2.0)
