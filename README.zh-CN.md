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
  <strong>给穿越者准备的极简军师 App。</strong>
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

Timet 是一个面向历史 / 架空穿越场景的多语言、离线优先策略助手。
你直接告诉它时代、地点、身份、手里资源和目标。
它不会陪你空谈设定，而是像小说军师一样，给你一条能落地的首富线、上位线、避坑线或现代知识外挂路线。

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
      直接按 <code>时代 + 地点 + 身份 + 资源 + 目标</code> 开问，也可以从 <code>首富线</code>、<code>上位线</code>、<code>避坑线</code>、<code>现代知识外挂</code> 入口切入。
    </td>
    <td valign="top">
      <strong>军师回答态</strong><br/>
      Timet 会固定收敛成五段式路线答复，并给出命中的路线来源，方便你继续往下拆阶段执行。
    </td>
  </tr>
</table>

## 为什么是 Timet

- 先给路线，不先堆设定。重点是怎么走，不是背景故事复述。
- 中文和英文一起做，不是只照顾单一语言用户。
- 故意不做时代选择器，也不假装“自动识别时代”。
- 回答结构固定，方便持续追问和拆阶段执行。
- 以本地模型和离线知识包为核心，而不是依赖云端包装。

## 提问契约

Timet 最适合的问题格式：

`时代 + 地点 + 身份 + 资源 + 目标`

### 推荐提问

| 路线 | 中文示例 | 英文示例 |
| --- | --- | --- |
| `首富线` | `我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？` | `Regency London, literate clerk, a few guineas, how do I build my first fortune in 90 days?` |
| `上位线` | `我在晚清上海通商口岸，给商号跑单，怎样先结交靠山再上位？` | `Tudor London, I serve in a noble household. How do I gain influence without getting crushed?` |
| `避坑线` | `我在南宋临安，刚到陌生城里，没有靠山，最先不能暴露什么？` | `I just arrived in medieval London with no patron. What must I hide first to blend in?` |
| `现代知识外挂` | `我在晚清上海，有一点本钱，哪些现代知识最先能变成真钱？` | `Victorian London, a little capital. Which modern methods can I turn into real money first?` |

## 回答契约

Timet 的核心回答固定收敛成五段：

1. `局面判断`
2. `先走三步`
3. `发财 / 上位主路径`
4. `绝不能暴露的事`
5. `你下一句该问什么`

回答风格示意：

```text
局面判断
你处在一个高流通、低本钱的起步局面，真正值钱的是周转、信用和掩护，而不是一开局就跨时代发明。

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

## 核心路线

| 路线 | 作用 | 适合的问题 |
| --- | --- | --- |
| `首富线` | 找到第一条稳定赚钱的现实路径。 | 小本生意、商路、账房、套利、渠道 |
| `上位线` | 先变成有用的人，再慢慢变成不能绕过的人。 | 门路、结盟、官场边缘、军政后勤、豪门依附 |
| `避坑线` | 先告诉你哪些话不能说、哪些事不能做。 | 刚穿越、身份未稳、礼法未知、口音和习俗风险 |
| `现代知识外挂` | 把现代知识降级成这个时代能真的吃下去的优势。 | 工艺、流程、包装、标准化、组织效率 |
| `视觉线索` | 从钱币、文字、器物这些线索里反推下一步。 | 看图提问、环境判断、补时代感知 |

## 产品原则

- 时代或地点没说清，就追问，不胡编。
- 默认先走 `首富线`，只有明确问权力才把 `上位线`提到主位。
- 低资源、低工艺时代，不给明显做不成的工业神话。
- 口吻可以像军师，但路径必须可执行。
- 历史 / 架空是产品语境，不把内容做成现实世界伤害教程。

## 快速开始

```bash
npm install
npm run knowledge:build
npm run dev
```

验证：

```bash
npm test
dart test
npm run build
```

移动端壳层：

```bash
npm run mobile:android
npm run mobile:ios
```

## 仓库导览

- [路线设计说明](./docs/ROUTES.md)
- [知识包说明](./docs/KNOWLEDGE_PACK.md)
- [参与贡献](./CONTRIBUTING.zh-CN.md)
- [安全策略](./SECURITY.zh-CN.md)
- [最新版本](https://github.com/wimi321/timet/releases)

## 路线图

- [x] 完成路线驱动的 V1 问答形态
- [x] 补齐中文与英文核心产品文案
- [x] 完成首批离线穿越知识包
- [x] 完成公开 GitHub 仓库、CI 与 Release
- [x] 补齐公开展示素材和 README 截图
- [ ] 扩大时代与地区覆盖面
- [ ] 补更完整的移动端发布产物

## License

Timet 基于 [Apache-2.0](./LICENSE) 开源。
