# Tickel — Product Specification

## Overview

Tickel 是一个 Claude Code session token 用量可视化工具。它读取本地 Claude Code session 文件，计算花费，并生成一张可下载的 PNG 收据图片。

## 用户流程

1. 用户在 Claude Code 中完成一次对话
2. 运行 `tickel <session-id>` 或 `tickel`（自动读取当前 session）
3. CLI 输出终端摘要（模型、token 数、费用）
4. 浏览器打开 Web 收据页面
5. 用户点击 "Download PNG" 获取高清收据图片

## 系统架构

```
┌─────────┐         URL params         ┌──────────────┐
│   CLI   │ ──── open browser ────────→ │   Web (SPA)  │
└────┬────┘                             └──────┬───────┘
     │                                         │
     │ read                                    │ render + export
     ▼                                         ▼
~/.claude/projects/<slug>/<sid>.jsonl     PNG receipt image
```

- **CLI**: Node.js 命令行工具，发布为 npm 包 `tickel`
- **Web**: 静态单页应用，部署到 Vercel，纯客户端渲染

两者通过 URL query params 通信，无 API server。

## CLI 规格

### 数据源

主会话路径: `~/.claude/projects/<project-slug>/<session-id>.jsonl`

Claude Code sub-agent 会话路径: `~/.claude/projects/<project-slug>/<session-id>/subagents/*.jsonl`

每行为 JSON 对象，关注字段:
- `message.model` — 模型名称
- `message.usage.input_tokens`
- `message.usage.output_tokens`
- `message.usage.cache_creation_input_tokens`
- `message.usage.cache_read_input_tokens`
- `timestamp` — ISO 字符串或毫秒时间戳

CLI 遍历主会话和 sub-agent JSONL，按 `message.model` 累加 token 数。Sub-agent 不作为单独展示维度；如果主会话和 sub-agent 使用同一模型，合并到同一个模型明细行。

### 价格计算

CLI 使用仓库内置价格快照计算费用，价格单位为 USD/1M tokens。价格快照由同步脚本从 models.dev 拉取官方 provider allowlist 后生成，运行时不联网获取价格。

支持字段:
- `input` — 输入 token 单价
- `output` — 输出 token 单价
- `cache_write` — 缓存写入单价
- `cache_read` — 缓存读取单价

`input_tokens` 已包含 cache creation/read token，费用计算先扣除 cache 部分，再分别按 cache 单价计费。

公式:
```
base_input_tokens = max(0, input_tokens - cache_write_tokens - cache_read_tokens)

cost = (base_input_tokens / 1M) × input_price
     + (output_tokens / 1M) × output_price
     + (cache_write_tokens / 1M) × cache_write_price
     + (cache_read_tokens / 1M) × cache_read_price
```

模型解析规则:
- 优先匹配手工维护的非标准 model id 映射（例如 Claude Code session 中不符合官方 ID 的模型名）
- 其次匹配 `provider/model-id` 形式的精确 key
- 最后在 allowlist provider 中仅当 `model-id` 唯一时自动匹配
- 未知或歧义模型返回 cost = 0

### 命令

| 命令 | 说明 |
|------|------|
| `tickel [session-id]` | 生成单次 session 收据。无参数时读取当前项目目录最新 session |
| `tickel today` | 按运行机器本地日期聚合当日 usage |

### 选项

| 选项 | 说明 |
|------|------|
| `-t, --template <id>` | 收据模板 ID（`default` \| `minimal` \| `ledger`） |
| `--print` | 仅终端输出摘要，不打开浏览器 |
| `--version` | 显示版本号 |

### 终端输出格式

```
🧾 Tickel — <project> (<date>)
   Model:        <model>
   Input:        <n> tokens
   Output:       <n> tokens
   Cache write:  <n> tokens
   Cache read:   <n> tokens
   Cost:         $<cost>
```

### URL 构造

Base: `https://tickel.vercel.app/`

Web 优先解析 v2 结构化 payload；如果缺失或解析失败，回退到旧 query 参数，确保历史链接仍可打开。

#### v2 payload

Query 参数:
| 参数 | 值 |
|------|------|
| `payload` | base64url(JSON) |

Payload JSON:
```json
{
  "version": 2,
  "source": { "agent": "claude-code" },
  "receipt": {
    "title": "Tickel",
    "date": "2026-05-06",
    "templateId": "default",
    "totalCost": 0.1234,
    "totals": {
      "inputTokens": 300,
      "outputTokens": 30,
      "cacheWriteTokens": 40,
      "cacheReadTokens": 50
    },
    "items": [
      {
        "agent": "claude-code",
        "model": "claude-sonnet-4-5",
        "inputTokens": 300,
        "outputTokens": 30,
        "cacheWriteTokens": 40,
        "cacheReadTokens": 50,
        "cost": 0.1234
      }
    ]
  }
}
```

`items[].agent` 为后续 CodeBuddy 等不同 coding agent 预留；同一 agent 下可有多个 model，不同 agent 也可以出现相同 model。

#### legacy params

Query params:
| 参数 | 值 |
|------|------|
| `model` | 模型全名 |
| `in` | input token 数 |
| `out` | output token 数 |
| `cw` | cache write token 数 |
| `cr` | cache read token 数 |
| `cost` | 计算费用（4 位小数） |
| `title` | 项目名 |
| `date` | YYYY-MM-DD |
| `templateId` | 模板 ID |

## Web 规格

### 技术约束

- 纯静态导出（`output: "export"`），无 server-side 逻辑
- 所有数据来自 URL query params
- 单页面 `/`

### 收据渲染

从 URL params 解析为结构化数据后，根据 `templateId` 选择模板组件渲染。

### 手动编辑

Web 页面将 URL 参数作为初始值载入，然后在客户端维护可编辑草稿。用户可以在导出前调整:
- 项目名
- 日期
- 模板
- agent 名称
- model 名称
- input/output/cache token
- model subtotal cost

编辑模型明细时，页面会重新计算收据总 token 和总费用；PNG 导出始终捕获编辑后的收据，不回读原始 URL。

### 模板系统

#### `default` — 热敏打印小票风格

- 等宽字体
- 固定宽度 288px
- 布局: 标题 → 虚线分隔 → 项目信息 → 虚线分隔 → token 明细 → 实线分隔 → 合计 → 虚线分隔 → 页脚
- 配色: 白底灰字，label 为浅灰，数值为黑色

#### `minimal` — 现代卡片风格

- 系统字体 + 等宽数字
- 圆角卡片 320px
- 布局: 项目名+日期头部 → 2×2 token 网格（灰色圆角 pill） → 黑底合计栏
- token 数字使用智能格式化（>1M 显示 "x.xxM"，>1K 显示 "x.xK"）

#### `ledger` — 分享型账本风格

- 衬线标题 + 等宽金额数字
- 固定宽度 380px
- 布局: 深色头部 → token 指标 → agent/model 明细 → 大号合计
- 用于社交分享或更高识别度的收据图片

### PNG 导出

- 捕获 `#receipt` 元素
- 3× 缩放（retina 清晰度）
- 输出文件名: `tickel-<date>.png`
- 使用 dom-to-image 方式将 DOM 转为 blob 后触发下载

## 项目名提取

从目录 slug 推断项目名:
- slug 格式: `-Users-chanler-personal-Tickel` → 取最后一段 `Tickel`

## 分发

- CLI: npm 包 `tickel`，全局安装 `npm i -g tickel`
- Web: Vercel 静态部署，域名 `tickel.vercel.app`

## 扩展预留

- 更多模板（通过 `templateId` 扩展）
- 更多官方 provider 价格快照
