# 穿越助手 / Timet

<p align="center">
  <a href="https://github.com/wimi321/timet/releases">
    <img alt="Release" src="https://img.shields.io/github/v/release/wimi321/timet?style=flat-square">
  </a>
  <a href="https://github.com/wimi321/timet/actions/workflows/ci.yml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/wimi321/timet/ci.yml?branch=main&style=flat-square&label=CI">
  </a>
  <a href="./LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/wimi321/timet?style=flat-square">
  </a>
  <img alt="Platforms" src="https://img.shields.io/badge/platforms-Web%20%7C%20Android%20%7C%20iOS-111827?style=flat-square">
  <a href="https://github.com/wimi321/timet/stargazers">
    <img alt="Stars" src="https://img.shields.io/github/stars/wimi321/timet?style=flat-square">
  </a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-8-119EFF?style=flat-square&logo=capacitor&logoColor=white">
  <img alt="Dart" src="https://img.shields.io/badge/Dart-3.4-0175C2?style=flat-square&logo=dart&logoColor=white">
</p>

<p align="center">
  <strong>给穿越者准备的极简军师 App。</strong>
</p>

<p align="center">
  <a href="https://github.com/wimi321/timet/releases/latest/download/timet-0.1.1-arm64.apk">
    <img alt="下载 APK" src="https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD%20APK-arm64-2ea44f?style=for-the-badge&logo=android&logoColor=white">
  </a>
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <a href="./README.zh-CN.md">简体中文</a>
  ·
  <a href="https://github.com/wimi321/timet/releases">发布版本</a>
  ·
  <a href="./docs/ROUTES.md">路线设计</a>
  ·
  <a href="./docs/KNOWLEDGE_PACK.md">知识包</a>
  ·
  <a href="https://github.com/wimi321/timet/discussions">讨论区</a>
</p>

<p align="center">
  <img src="./docs/assets/timet-hero.svg" alt="Timet hero" width="100%">
</p>

告诉 Timet 你的**时代**、**地点**、**身份**、**手里资源**和**目标**——它会给你一条能走的首富线、上位线、避坑线或现代知识外挂路线。不堆设定，不空谈背景。每条回答都收敛成**五段式军师简报**，拿到就能拆步骤执行。

## 产品预览

<table>
  <tr>
    <td width="50%">
      <img src="./docs/assets/timet-home-zh-cn.png" alt="Timet 中文首页截图" width="100%" />
    </td>
    <td width="50%">
      <img src="./docs/assets/timet-answer-zh-cn.png" alt="Timet 中文回答截图" width="100%" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>首页封面态</strong><br/>
      直接按 <code>时代 + 地点 + 身份 + 资源 + 目标</code> 开问，也可以从路线入口切入。
    </td>
    <td valign="top">
      <strong>军师回答态</strong><br/>
      Timet 固定收敛成五段式路线答复，给出命中的知识包来源，方便继续拆阶段执行。
    </td>
  </tr>
</table>

## 特性

- **先给路线，不先堆设定** — 重点是怎么走，不是背景故事复述。
- **五段式结构化回答** — 每条回复都收敛为：局面判断、先走三步、主路径、避坑项、下一步该问什么。
- **离线优先架构** — 内置知识包 + 本地模型推理，不依赖服务器。
- **20 种语言** — 中英文深度适配，另支持 18 种语言。
- **端侧 AI** — 通过 LiteRT 在手机端本地运行 Gemma 4，数据不离开设备。
- **全平台** — 一套代码通过 Capacitor 发布到 Web、Android 和 iOS。

## 工作原理

**提问公式：**

`时代 + 地点 + 身份 + 资源 + 目标`

**提问示例：**

| 路线 | 提问 |
| --- | --- |
| 首富线 | `我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？` |
| 上位线 | `我在晚清上海通商口岸，给商号跑单，怎样先结交靠山再上位？` |
| 避坑线 | `我在南宋临安，刚到陌生城里，没有靠山，最先不能暴露什么？` |
| 现代知识外挂 | `我在晚清上海，有一点本钱，哪些现代知识最先能变成真钱？` |

**回答契约 — 每条回复固定收敛为五段：**

1. **局面判断** — 先看清盘面再出手
2. **先走三步** — 低门槛、可复制的起手式
3. **发财 / 上位主路径** — 核心攀升路线
4. **绝不能暴露的事** — 会让你暴露或送命的禁区
5. **你下一句该问什么** — 把路线拆成 7 / 30 / 90 天

<details>
<summary>完整回答示例</summary>

```text
局面判断
你处在一个高流通、低本钱的起步局面，
真正值钱的是周转、信用和掩护，而不是一开局就跨时代发明。

先走三步
1. 先做高频、轻资产、重复需求的货或服务。
2. 先把账本、标价和交付稳定下来。
3. 先靠近客栈、码头、书坊、行会一类稳定客流。

发财 / 上位主路径
先让现金流站稳，再把文书、渠道、票据、关系网一层层接上去。

绝不能暴露的事
不要让人觉得你像妖人、骗子，或对这个时代知道得不正常。

你下一句该问什么
把这条路线拆成 7 天 / 30 天 / 90 天。
```

</details>

## 核心路线

| 路线 | 作用 | 适合的问题 |
| --- | --- | --- |
| `首富线` | 找到第一条稳定赚钱的现实路径。 | 小本生意、商路、账房、套利、渠道 |
| `上位线` | 先变成有用的人，再慢慢变成不能绕过的人。 | 门路、结盟、官场边缘、军政后勤、豪门依附 |
| `避坑线` | 先告诉你哪些话不能说、哪些事不能做。 | 刚穿越、身份未稳、礼法未知、口音和习俗风险 |
| `现代知识外挂` | 把现代知识降级成这个时代能真的吃下去的优势。 | 工艺、流程、包装、标准化、组织效率 |
| `视觉线索` | 从钱币、文字、器物这些线索里反推下一步。 | 看图提问、环境判断、补时代感知 |

## 快速开始

**前置条件：** Node.js >= 20 · Dart >= 3.4

```bash
# 安装依赖并构建知识包
npm install
npm run knowledge:build

# 启动开发服务器
npm run dev

# 运行测试
npm test && dart test

# 生产构建
npm run build
```

**移动端（需要 Xcode / Android Studio）：**

```bash
npm run mobile:ios
npm run mobile:android
```

## 技术栈

React 18 · TypeScript · Vite 8 · Vitest · Capacitor 8 · Dart 3 · Gemma 4 (LiteRT) · 离线知识 RAG

## 路线图

- [x] 完成路线驱动的 V1 问答形态
- [x] 补齐中文与英文深度适配产品文案
- [x] 完成首批离线穿越知识包与路线感知检索
- [x] 完成公开 GitHub 仓库、CI 与 Release
- [x] 补齐公开展示素材和 README 截图
- [ ] 扩大时代与地区知识覆盖面
- [ ] 完善移动端发布产物（APK、TestFlight）
- [ ] 多轮追问的 Session Memory
- [ ] 社区贡献知识包流程
- [ ] 自定义路线支持

## 参与贡献

欢迎贡献——无论是新知识包、语言改进还是 bug 修复。请先阅读 [CONTRIBUTING.zh-CN.md](./CONTRIBUTING.zh-CN.md)。

## 仓库导览

- [路线设计说明](./docs/ROUTES.md)
- [知识包说明](./docs/KNOWLEDGE_PACK.md)
- [安全策略](./SECURITY.zh-CN.md)
- [变更日志](./CHANGELOG.md)

## License

Timet 基于 [Apache-2.0](./LICENSE) 开源。

---

<p align="center">
  如果 Timet 帮你规划了穿越大业，欢迎给一颗 <a href="https://github.com/wimi321/timet/stargazers">Star</a>。
</p>
