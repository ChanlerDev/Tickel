# Tickel Development Conventions

## 项目边界

- pnpm monorepo：`packages/cli` 是 npm CLI 包，`packages/web` 是静态前端。
- CLI 负责读取本地会话数据、计算费用、打开前端 URL；Web 负责展示和导出收据。
- 保持本地优先和隐私边界：不要上传、持久化或暴露原始会话内容。

## 开发循环

1. 判断需求是否有用户价值；低价值或不可行时，先说明问题并给出可行替代方案。
2. 用户可见的新功能先加入 `docs/ROADMAP.md` 的 `## Planned`；临时 bugfix 不必进 roadmap。
3. 实现时保持改动聚焦，遵循现有结构和风格；根据风险补测试。
4. 用户可见行为变化更新 `docs/CHANGELOG.md`；产品语义或契约变化更新 `docs/SPEC.md`；安装和使用变化更新 README。
5. 如果实现了 roadmap 项，完成后从 `## Planned` 移到 `## Done`，保留历史。
6. 运行 `pnpm agent:check` 后再交付。

## Agent 脚本

- `pnpm agent:check`：根据最近一次 `v*` release tag 以来的 `packages/cli` / `packages/web` 变更，自动运行需要的验证。
- `pnpm agent:release`：默认 patch release；要求 CLI 和 changelog 已有变更；自动 bump version、生成 release commit、打 tag、push branch 和 tag。
- 只有用户明确要求 minor 时才运行 `pnpm agent:release minor`。
- npm publish 由 `v*` tag 触发 GitHub Actions；前端由 Vercel 在 push 后自动部署。不要手动发布，除非用户明确要求或自动化失败需要恢复。

## Commit 规范

- 使用 Conventional Commits，通常只写一行 title。
- 按业务含义拆分 commit；实现、文档、release 元数据不要无意义混在一起。
- 常规开发不 bump version；发版只通过 `pnpm agent:release`，不要手写 version、tag、push 流程。
