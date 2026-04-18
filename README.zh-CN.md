# 穿越助手 / Timet

<p align="center">
  <strong>给穿越者准备的极简军师 App。</strong>
</p>

<p align="center">
  Timet 基于原 Beacon 壳层能力重做，但定位已经完全切到穿越题材：
  你直接写出时代、地点、身份、资源和目标，
  它就按小说军师口吻给你首富线、上位线、避坑线和现代知识外挂。
</p>

## 品牌

- 中文名：`穿越助手`
- 英文短名：`Timet`
- 完整展示名：`穿越助手 / Timet`
- 英文副说明：`A time-travel strategy assistant`

## 产品形态

- V1 只做 `简单问答`
- 不做时代选择器
- 不做自动判断时代
- 不做成长系统
- 不做身份模板
- 用户自己在问题里交代背景

推荐提问公式：

`时代 + 地点 + 身份 + 资源 + 目标`

例如：

- `我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？`
- `晚清上海通商口岸，小商人，怎么先发财再积攒影响力？`
- `我刚穿到陌生古代城市，最先不能暴露什么？`

## 主要路线

- `首富线`
- `上位线`
- `避坑线`
- `现代知识外挂`
- `视觉线索`

## 离线知识包

当前离线知识包围绕以下主题重建：

- 经商套利与商路起家
- 结盟、门路、 patronage、合法性
- 刚穿越时的藏锋与避坑
- 真能落地的现代工艺、流程和标准化外挂
- 通商口岸与近现代商业加速路线
- 钱币、文字、印章、衣料、器物的线索扫描

Timet 的回答固定输出五段：

1. `局面判断`
2. `先走三步`
3. `发财 / 上位主路径`
4. `绝不能暴露的事`
5. `你下一句该问什么`

## 技术栈

- React + Vite 前端
- Capacitor 原生壳
- 沿用原 Beacon 的本地模型桥接能力
- 由 `knowledge/source_manifest.json` 和 `knowledge/entry_seed.json` 生成离线知识包

## 进一步文档

- [路线设计说明](./docs/ROUTES.md)
- [知识包说明](./docs/KNOWLEDGE_PACK.md)

## 本地开发

```bash
npm install
npm run knowledge:build
npm test
npm run build
```

## 说明

- GitHub 仓库：[wimi321/timet](https://github.com/wimi321/timet)
- 原来的 `/Users/haoc/Developer/Beacon` 没有被修改。
- 当前项目是独立拷贝后的新仓库：`/Users/haoc/Developer/timet`。
- 继承来的 Beacon 本地远程已经改名为 `beacon-local`。
- 当前 `origin` 已经指向正式发布仓库。
