# Timet / 穿越助手

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
  <strong>A time-travel strategy assistant for people who woke up in the wrong century.</strong>
</p>

<p align="center">
  <a href="./README.md">English</a>
  ·
  <a href="./README.zh-CN.md">简体中文</a>
  ·
  <a href="https://github.com/wimi321/timet/releases">Releases</a>
  ·
  <a href="./docs/ROUTES.md">Route Design</a>
  ·
  <a href="./docs/KNOWLEDGE_PACK.md">Knowledge Pack</a>
  ·
  <a href="https://github.com/wimi321/timet/discussions">Discussions</a>
</p>

<p align="center">
  <img src="./docs/assets/timet-hero.svg" alt="Timet hero" width="100%">
</p>

Timet is a multilingual, offline-first strategy app built for historical and fictional time-travel scenarios.
You describe the era, place, identity, starting resources, and goal.
Timet answers like a sharp strategist with practical routes for wealth, influence, cover, and realistic modern-edge leverage.

## Product Preview

<table>
  <tr>
    <td width="50%">
      <img src="./docs/assets/timet-home-en.png" alt="Timet home screen in English" />
    </td>
    <td width="50%">
      <img src="./docs/assets/timet-answer-en.png" alt="Timet answer screen in English" />
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>Home briefing</strong><br/>
      Start with <code>era + place + identity + resources + goal</code>, then pick a route or type straight into the strategist.
    </td>
    <td valign="top">
      <strong>Route answer</strong><br/>
      Timet replies in a five-part strategist brief, grounded in the local knowledge pack and written for action.
    </td>
  </tr>
</table>

## Why Timet

- Route-first, not lore-first. It gives you a playable path, not a wall of background trivia.
- Chinese and English first. The core UX and prompt examples are written for both.
- Deliberately no era picker and no fake era detection. You state the board yourself.
- Structured answers. Timet always converges on a five-part answer shape.
- Offline-first shell. The app keeps local model and bundled knowledge support at the center of the product.

## Prompt Contract

Timet works best when the question includes:

`era + place + identity + resources + goal`

### Example prompts

| Route | Chinese | English |
| --- | --- | --- |
| Fortune Line | `我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？` | `Northern Song Kaifeng, literate, little silver, how do I make my first fortune in 90 days?` |
| Power Line | `我在晚清上海通商口岸，给商号跑单，怎样先结交靠山再上位？` | `Late Qing treaty port, I run papers for a trading house. How do I gain influence without getting crushed?` |
| Fatal Mistakes | `我在南宋临安，刚到陌生城里，没有靠山，最先不能暴露什么？` | `I just arrived in a medieval city with no backing. What must I hide first to blend in?` |
| Modern Edge | `我在晚清上海，有一点本钱，哪些现代知识最先能变成真钱？` | `Late Qing Shanghai with a little capital. Which modern methods can I turn into money first?` |

## Answer Contract

Every core answer is shaped into five sections:

1. `Current Read`
2. `First Three Moves`
3. `Riches / Power Path`
4. `Do Not Expose`
5. `Ask Me Next`

Example:

```text
Current Read
You are in a high-circulation city with low starting capital, which means trust and turnover matter more than miracle inventions.

First Three Moves
1. Start with repeat-demand goods or services.
2. Win trust with clean ledgers and fixed prices.
3. Anchor near inns, docks, guild traffic, or literate commerce.

Riches / Power Path
Stabilize cash flow first, then use paperwork, brokerage, supply discipline, or patronage to climb.

Do Not Expose
Do not sound supernatural, over-informed, or culturally wrong too early.

Ask Me Next
Break this route into 7-day, 30-day, and 90-day phases.
```

## Core Routes

| Route | What it does | Best used for |
| --- | --- | --- |
| `Fortune Line` | Finds the fastest realistic path to your first durable cash flow. | Trade, brokerage, ledgers, small goods, repeat demand |
| `Power Line` | Maps how to become useful before becoming visible. | Patronage, office, clerical leverage, court or military adjacency |
| `Fatal Mistakes` | Tells you what not to reveal before you understand the local rules. | Arrival cover, etiquette, speech, customs, identity protection |
| `Modern Edge` | Downgrades modern knowledge into era-appropriate advantages. | Process, packaging, standardization, practical workshop or business upgrades |
| `Visual Clues` | Uses visible objects as context and tells you what to ask next. | Coins, seals, script, garments, printed matter, artifacts |

## Product Principles

- No bluffing when era or place is missing.
- Wealth first by default, power only when explicitly requested.
- No impossible industrial leaps in low-resource settings.
- Strong strategist tone, but always anchored to executable steps.
- Historical or fictional context is the product frame, not a license for real-world harm advice.

## Quickstart

```bash
npm install
npm run knowledge:build
npm run dev
```

Verification:

```bash
npm test
dart test
npm run build
```

Mobile shell helpers:

```bash
npm run mobile:android
npm run mobile:ios
```

## Repository Guide

- [Route Design](./docs/ROUTES.md)
- [Knowledge Pack Notes](./docs/KNOWLEDGE_PACK.md)
- [Contributing](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Latest Release](https://github.com/wimi321/timet/releases)

## Roadmap

- [x] Route-driven V1 for wealth, power, cover, and modern-edge planning
- [x] Chinese and English first-run product copy
- [x] Curated offline knowledge pack with route-aware retrieval
- [x] Public GitHub release with CI, discussions, and release metadata
- [x] Better public demo assets and storefront-style screenshots
- [ ] Broader historical region coverage beyond the current seed set
- [ ] Richer release artifacts for mobile installation

## License

Timet is released under the [Apache-2.0 License](./LICENSE).
