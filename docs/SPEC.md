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

路径: `~/.claude/projects/<project-slug>/<session-id>.jsonl`

每行为 JSON 对象，关注字段:
- `message.model` — 模型名称
- `message.usage.input_tokens`
- `message.usage.output_tokens`
- `message.usage.cache_creation_input_tokens`
- `message.usage.cache_read_input_tokens`
- `timestamp` — 毫秒时间戳

CLI 遍历所有行，累加 token 数，取最后出现的有效 model 名。

### 价格计算

内置价格表，单位为 USD/1M tokens。支持字段:
- `input` — 输入 token 单价
- `output` — 输出 token 单价
- `cache_write` — 缓存写入单价
- `cache_read` — 缓存读取单价

公式:
```
cost = (input_tokens / 1M) × input_price
     + (output_tokens / 1M) × output_price
     + (cache_write_tokens / 1M) × cache_write_price
     + (cache_read_tokens / 1M) × cache_read_price
```

未知模型返回 cost = 0。

### 命令

| 命令 | 说明 |
|------|------|
| `tickel [session-id]` | 生成单次 session 收据。无参数时读取 `$CLAUDE_SESSION_ID` |
| `tickel today` | 聚合当日所有 session（预留） |

### 选项

| 选项 | 说明 |
|------|------|
| `-t, --template <id>` | 收据模板 ID（`default` \| `minimal`） |
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

### PNG 导出

- 捕获 `#receipt` 元素
- 3× 缩放（retina 清晰度）
- 输出文件名: `tickel-<date>.png`
- 使用 dom-to-image 方式将 DOM 转为 blob 后触发下载

## 项目名提取

从目录 slug 推断项目名:
- slug 格式: `-Users-chanler-personal-Tickel` → 取最后一段 `Tickel`

## 支持的模型价格

| Model | Input | Output | Cache Write | Cache Read |
|-------|-------|--------|-------------|------------|
| claude-opus-4-5 | $15.00 | $75.00 | $18.75 | $1.50 |
| claude-sonnet-4-5 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-sonnet-3-7 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-sonnet-3-5 | $3.00 | $15.00 | $3.75 | $0.30 |
| claude-haiku-3-5 | $0.80 | $4.00 | $1.00 | $0.08 |
| claude-opus-3 | $15.00 | $75.00 | $18.75 | $1.50 |
| gpt-4o | $2.50 | $10.00 | — | $1.25 |
| gpt-4o-mini | $0.15 | $0.60 | — | $0.075 |
| gemini-2.0-flash | $0.10 | $0.40 | — | $0.025 |
| gemini-1.5-pro | $1.25 | $5.00 | — | $0.3125 |

*单位: USD per 1M tokens*

## 分发

- CLI: npm 包 `tickel`，全局安装 `npm i -g tickel`
- Web: Vercel 静态部署，域名 `tickel.vercel.app`

## 扩展预留

- `tickel today` 聚合当日全部 session
- 更多模板（通过 `templateId` 扩展）
- 价格表远程更新
