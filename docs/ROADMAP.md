# Roadmap

## Planned

- [ ] 收据模板扩展 — 重构收据页面并提供至少三套可选样式，覆盖热敏小票、简洁卡片和更适合分享的视觉模板
- [ ] `tickel config` — 提供交互式配置，保存默认模板、Web URL、agent 偏好等本地设置
- [ ] CodeBody 支持 — 兼容 CodeBody 的会话数据读取和用量统计
- [ ] 收据页面美化 — 调整 Web 收据模板样式
- [ ] README — GitHub repo 添加使用说明

## Done

- [x] 收据参数协议 v2 — 用可扩展 payload 表达 coding agent、模型明细、费用和展示偏好，并保留旧 URL 参数兼容
- [x] Web 收据编辑器 — 前端支持手动调整项目、日期、agent、模型 token/费用和模板等参数，修正本地统计误差或临时改样式
- [x] 官方模型价格表同步 — 基于官方 provider allowlist 从 models.dev 生成价格表快照，降低手动维护错误
- [x] Claude Code sub-agent 用量 — 读取 `<session-id>/subagents/*.jsonl` 并按模型平铺合并到小票总费用
- [x] 子目录兼容 — 在项目子目录运行时向上找 git root 匹配 slug
- [x] 多模型分账 — 单 session 内按模型分别统计 token 和费用，用户切模型时正确拆分
- [x] Slash command 精确会话定位 — 使用 `${CLAUDE_SESSION_ID}` 内置变量替代 mtime 查找，解决多会话场景错配问题 (0.2.2)
- [x] `tickel today` — 聚合当日所有 session 的 token 用量和费用 (0.2.0)
