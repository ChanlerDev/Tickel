# Roadmap

## Planned

- [ ] PNG 导出白边修复 — 下载图片中文字周围出现白色矩形伪影，排查 dom-to-image 渲染问题
- [ ] Agent 分层展示 — 以 agent 为第一层级、model 为第二层级组织收据明细，支持多 agent 场景
- [ ] 前端自动计算费用 — Web 编辑器内置价格表，编辑 token 数后自动重算 cost
- [ ] 模板切换动画 — 切换模板时 receipt 平滑过渡
- [ ] 预览舞台底色区分 — 左侧预览区使用微弱纹理/底色让 receipt 更聚焦
- [ ] 编辑状态持久化 — 编辑后同步回 URL search params（replaceState），刷新不丢失
- [ ] README — GitHub repo 添加使用说明
- [ ] CodeBuddy 完善 — 修复已知问题
  - [ ] `tickel` 默认取最近会话 — 同时检查 Claude 和 CodeBuddy，取 mtime 最新的（而非优先 Claude）
  - [ ] `tickel today` 区分 agent — 多 agent 混合场景下，收据需标注涉及的 coding agents
  - [ ] `tickel install` 支持 CodeBuddy — 安装 CodeBuddy 的 slash command

## Done

- [x] CodeBuddy 支持 — 兼容 CodeBuddy 的会话数据读取和用量统计
- [x] 收据页面改版 — 双栏工作台布局，左侧预览主舞台 + 右侧参数控制面板，提升信息架构和视觉完成度
- [x] 收据参数协议 v2 — 用可扩展 payload 表达 coding agent、模型明细、费用和展示偏好，并保留旧 URL 参数兼容
- [x] Web 收据编辑器 — 前端支持手动调整项目、日期、agent、模型 token/费用和模板等参数，修正本地统计误差或临时改样式
- [x] 收据模板扩展 — 重构收据页面并提供至少三套可选样式，覆盖热敏小票、简洁卡片和更适合分享的视觉模板
- [x] `tickel config` — 提供交互式配置，保存默认模板、Web URL、agent 偏好等本地设置
- [x] 官方模型价格表同步 — 基于官方 provider allowlist 从 models.dev 生成价格表快照，降低手动维护错误
- [x] Claude Code sub-agent 用量 — 读取 `<session-id>/subagents/*.jsonl` 并按模型平铺合并到小票总费用
- [x] 子目录兼容 — 在项目子目录运行时向上找 git root 匹配 slug
- [x] 多模型分账 — 单 session 内按模型分别统计 token 和费用，用户切模型时正确拆分
- [x] Slash command 精确会话定位 — 使用 `${CLAUDE_SESSION_ID}` 内置变量替代 mtime 查找，解决多会话场景错配问题 (0.2.2)
- [x] `tickel today` — 聚合当日所有 session 的 token 用量和费用 (0.2.0)
