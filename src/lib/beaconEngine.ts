import type {
  EvidenceBundle,
  ModelDescriptor,
  ModelDownloadProgress,
  PowerMode,
  RetrievedKnowledge,
  RouteHint,
  SosState,
  TriageRequest,
  TriageResponse,
} from './types';
import {
  ensureKnowledgeBaseLoaded,
  getKnowledgeCards,
  knowledgeCardToRetrieved,
  type KnowledgeCard,
} from './knowledgeBase';
import {
  CANONICAL_ROUTE_HINTS,
  getScenarioPrimaryCategories,
  getScenarioRetrievalTerms,
  normalizeScenarioHint,
  type CanonicalRouteHint,
} from './scenarioHints';
import { translateMessage } from '../i18n/translate';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GROUNDING_MAX_CHARS = 860;
const GROUNDING_SUMMARY_CHARS = 168;
const GROUNDING_STEP_CHARS = 104;

const ERA_PATTERN =
  /(北宋|南宋|宋朝|唐朝|明朝|明末|晚明|清朝|晚清|汉朝|漢朝|秦朝|隋唐|战国|戰國|春秋|民国|民國|维多利亚|維多利亞|罗马|羅馬|拜占庭|Byzantine|Roman|Tang|Song|Ming|Qing|Han|Edo|Tokugawa|Victorian|Regency|Georgian|Tudor|Elizabethan|Restoration|Stuart|late qing|early modern|medieval|renaissance|industrial|colonial|republic|empire|kingdom|dynasty|18\\d{2}|19\\d{2}|20\\d{2})/i;
const PLACE_PATTERN =
  /(汴京|东京|東京|开封|開封|临安|臨安|长安|長安|洛阳|洛陽|江南|苏州|蘇州|杭州|扬州|揚州|广州|廣州|上海|南京|京城|港口|边镇|邊鎮|London|Paris|Rome|Venice|Florence|Constantinople|Istanbul|Kaifeng|Hangzhou|Suzhou|Shanghai|Nanjing|Kyoto|Edo|Edinburgh|Manchester|York|Bristol|Glasgow|Oxford|Cambridge|Scotland|Highlands|England|Britain|New York|Boston|Philadelphia|port|treaty port|capital|frontier|county|city|court)/i;
const LOW_RESOURCE_PATTERN =
  /(一点|一點|少量|little|small|basic|只有|只剩|碎银|碎銀|small trader|little silver|few coins|no backing|寒门|寒門|poor|broke)/i;

const ROUTE_SIGNAL_PATTERNS: Record<Exclude<RouteHint, 'visual_help'>, RegExp> = {
  wealth:
    /(首富|发财|發財|赚钱|賺錢|生意|买卖|買賣|商路|货栈|貨棧|套利|账本|帳本|merchant|trade|profit|fortune|rich|business|pricing|ledger|brand|channel)/i,
  power:
    /(上位|掌权|掌權|称王|稱王|皇帝|摄政|攝政|官场|官場|宫廷|宮廷|权臣|權臣|门客|門客|派系|朝堂|court|faction|office|patronage|patron|household|influence|climb|throne|rule|power|governance|legitimacy)/i,
  survival:
    /(保命|活下来|活下來|避坑|藏锋|藏鋒|别暴露|別暴露|融入|礼法|禮法|口音|习俗|習俗|blend in|fatal mistake|custom|etiquette|cover story|suspicion)/i,
  tech:
    /(技术|技術|发明|發明|工艺|工藝|肥皂|玻璃|印刷|蒸馏|蒸餾|标准化|標準化|组织|組織|supply chain|process|technology|printing|soap|glass|manufacture|standardization|modern knowledge)/i,
};

type ResourceProfile = {
  isLowResource: boolean;
};

function compactWhitespace(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function compactSnippet(value: string | undefined, maxChars: number): string {
  const normalized = compactWhitespace(value);
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function normalizeToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, ' ')
    .trim();
}

function buildSearchText(card: KnowledgeCard): string {
  return normalizeToken([
    card.pack,
    card.route,
    card.title,
    card.summary,
    ...card.steps,
    ...card.contraindications,
    card.escalation,
    ...card.tags,
    ...card.aliases,
    card.category,
    card.eraLabel,
    ...(card.region ?? []),
    ...(card.socialFit ?? []),
    ...(card.startingResources ?? []),
    ...(card.firstMoves ?? []),
    ...(card.fatalMistakes ?? []),
    card.payoff,
    card.coverStory,
    card.source,
    card.sourceId,
  ].join(' '));
}

function tokenizeQuery(input: string): string[] {
  const normalized = normalizeToken(input);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(/\s+/).filter((token) => token.length > 1);
  const compact = normalized.replace(/\s+/g, '');
  const cjkBigrams: string[] = [];
  for (let index = 0; index < compact.length - 1; index += 1) {
    const pair = compact.slice(index, index + 2);
    if (/[\u4e00-\u9fff]/.test(pair)) {
      cjkBigrams.push(pair);
    }
  }

  return [...new Set([normalized, ...tokens, ...cjkBigrams])];
}

function inferRouteHints(query: string, explicitRoute: CanonicalRouteHint | null): CanonicalRouteHint[] {
  if (explicitRoute) {
    return [explicitRoute];
  }

  const inferred = (Object.entries(ROUTE_SIGNAL_PATTERNS) as Array<[Exclude<RouteHint, 'visual_help'>, RegExp]>)
    .filter(([, pattern]) => pattern.test(query))
    .map(([route]) => route);

  if (inferred.length === 0) {
    return [CANONICAL_ROUTE_HINTS.WEALTH];
  }

  if (!inferred.includes(CANONICAL_ROUTE_HINTS.WEALTH)) {
    inferred.unshift(CANONICAL_ROUTE_HINTS.WEALTH);
  }

  return [...new Set(inferred)];
}

function buildResourceProfile(query: string): ResourceProfile {
  return {
    isLowResource: LOW_RESOURCE_PATTERN.test(query),
  };
}

function hasEraAndPlaceContext(route: CanonicalRouteHint | null, query: string): boolean {
  if (route === CANONICAL_ROUTE_HINTS.VISUAL_HELP) {
    return true;
  }
  return ERA_PATTERN.test(query) && PLACE_PATTERN.test(query);
}

function firstThree<T>(items: readonly T[] | undefined): T[] {
  return [...(items ?? [])].slice(0, 3);
}

function buildAuthoritativeLabel(locale: string | undefined, route: RouteHint | undefined): string {
  const map: Partial<Record<RouteHint, string>> = {
    wealth: locale?.startsWith('zh') ? '首富线' : 'Fortune Line',
    power: locale?.startsWith('zh') ? '上位线' : 'Power Line',
    survival: locale?.startsWith('zh') ? '避坑线' : 'Fatal Mistakes',
    tech: locale?.startsWith('zh') ? '现代知识外挂' : 'Modern Edge',
    visual_help: locale?.startsWith('zh') ? '线索扫描' : 'Visual Clue Scan',
  };
  return map[route ?? 'wealth'] ?? (locale?.startsWith('zh') ? '路线' : 'Route');
}

function formatSection(title: string, body: string | string[]): string {
  if (Array.isArray(body)) {
    const lines = body.filter(Boolean);
    if (lines.length === 0) {
      return '';
    }
    return `**${title}**\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
  }

  if (!body.trim()) {
    return '';
  }

  return `**${title}**\n${body.trim()}`;
}

function composeStructuredRawText(
  locale: string | undefined,
  sections: {
    currentRead: string;
    firstMoves: string[];
    mainPath: string;
    doNotExpose: string[];
    askNext: string;
  },
): string {
  return [
    formatSection(translateMessage(locale, 'response.current_read'), sections.currentRead),
    formatSection(translateMessage(locale, 'response.first_moves'), sections.firstMoves),
    formatSection(translateMessage(locale, 'response.main_path'), sections.mainPath),
    formatSection(translateMessage(locale, 'response.do_not_expose'), sections.doNotExpose),
    formatSection(translateMessage(locale, 'response.ask_next'), sections.askNext),
  ]
    .filter(Boolean)
    .join('\n\n');
}

function routeBoost(card: KnowledgeCard, routes: CanonicalRouteHint[]): number {
  if (!card.route) {
    return 0;
  }

  const index = routes.findIndex((route) => route === card.route);
  if (index === -1) {
    return 0;
  }
  return index === 0 ? 44 : 28;
}

function fieldMatchBoost(queryTerms: string[], searchText: string): number {
  let score = 0;
  for (const term of queryTerms) {
    if (term.length <= 1) {
      continue;
    }
    if (searchText.includes(term)) {
      score += term.length <= 3 ? 4 : 8;
    }
  }
  return Math.min(score, 72);
}

function feasibilityBoost(card: KnowledgeCard, profile: ResourceProfile): number {
  if (!profile.isLowResource || !card.feasibility) {
    return 0;
  }

  if (card.feasibility === 'low_barrier') {
    return 16;
  }
  if (card.feasibility === 'high_barrier') {
    return -26;
  }
  return -6;
}

function contextBoost(card: KnowledgeCard, rawQuery: string): number {
  let score = 0;
  const query = normalizeToken(rawQuery);

  for (const region of card.region ?? []) {
    if (query.includes(normalizeToken(region))) {
      score += 12;
    }
  }

  if (card.eraLabel && query.includes(normalizeToken(card.eraLabel))) {
    score += 14;
  }

  for (const socialFit of card.socialFit ?? []) {
    if (query.includes(normalizeToken(socialFit))) {
      score += 10;
    }
  }

  return Math.min(score, 42);
}

function localeBoost(card: KnowledgeCard, locale: string | undefined): number {
  if (!card.locale) {
    return 0;
  }

  if (locale?.startsWith('zh')) {
    return card.locale.startsWith('zh') ? 10 : -4;
  }

  return card.locale.startsWith('en') ? 10 : 0;
}

function isPowerQuestion(query: string): boolean {
  return ROUTE_SIGNAL_PATTERNS.power.test(query);
}

function pickMainRoute(routes: CanonicalRouteHint[], query: string): CanonicalRouteHint {
  if (isPowerQuestion(query)) {
    return CANONICAL_ROUTE_HINTS.POWER;
  }
  return routes[0] ?? CANONICAL_ROUTE_HINTS.WEALTH;
}

export function createDefaultModels(): ModelDescriptor[] {
  return [
    {
      id: 'gemma-4-e2b',
      tier: 'e2b',
      name: 'Gemma 4 E2B',
      localPath: 'models/gemma-4-e2b.litertlm',
      sizeLabel: '2B / Strategy Baseline',
      isLoaded: true,
      isDownloaded: true,
      supportsImageInput: true,
      supportsVision: true,
      downloadStatus: 'succeeded',
      artifactFormat: 'litertlm',
      runtimeStack: 'litert-lm-c-api',
      minCapabilityClass: 'ios-6gb-plus',
      preferredBackend: 'auto-real',
      capabilityClass: 'supported',
      supportedDeviceClass: 'unknown',
    },
    {
      id: 'gemma-4-e4b',
      tier: 'e4b',
      name: 'Gemma 4 E4B',
      localPath: 'models/gemma-4-e4b.litertlm',
      sizeLabel: '4B / High Context',
      isLoaded: false,
      isDownloaded: false,
      supportsImageInput: true,
      supportsVision: true,
      downloadStatus: 'not_downloaded',
      artifactFormat: 'litertlm',
      runtimeStack: 'litert-lm-c-api',
      minCapabilityClass: 'ios-6gb-plus',
      preferredBackend: 'auto-real',
      capabilityClass: 'supported',
      supportedDeviceClass: 'unknown',
    },
  ];
}

export function retrieveEvidenceBundle(request: TriageRequest): EvidenceBundle {
  const cards = getKnowledgeCards();
  const rawCategoryHint = request.categoryHint?.trim() ?? '';
  const rawQuery = [rawCategoryHint, request.userText].filter(Boolean).join(' ').trim();
  const explicitRoute = normalizeScenarioHint(rawCategoryHint);
  const routes = inferRouteHints(rawQuery, explicitRoute);
  const scenarioTerms = routes.flatMap((route) => getScenarioRetrievalTerms(route));
  const queryTerms = tokenizeQuery([rawQuery, ...scenarioTerms].join(' '));
  const resourceProfile = buildResourceProfile(rawQuery);
  const primaryCategories = new Set(
    routes.flatMap((route) => getScenarioPrimaryCategories(route).map((category) => normalizeToken(category))),
  );

  const scored = cards
    .map((card) => {
      const searchText = buildSearchText(card);
      const categoryMatch =
        primaryCategories.has(normalizeToken(card.category)) ||
        normalizeToken(rawCategoryHint) === normalizeToken(card.category);
      const score =
        (categoryMatch ? 36 : 0) +
        routeBoost(card, routes) +
        fieldMatchBoost(queryTerms, searchText) +
        contextBoost(card, rawQuery) +
        localeBoost(card, request.locale) +
        feasibilityBoost(card, resourceProfile) +
        card.priority;

      if (score <= 20) {
        return null;
      }

      return knowledgeCardToRetrieved(card, score, categoryMatch ? 'directRule' : 'lexical');
    })
    .filter((item): item is RetrievedKnowledge => item != null)
    .sort((left, right) => right.score - left.score);

  const deduped = scored.filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
  const authoritative = deduped.filter((item) => item.score >= 58).slice(0, 3);
  const supporting = deduped
    .filter((item) => !authoritative.some((candidate) => candidate.id === item.id))
    .slice(0, 2);

  return {
    authoritative,
    supporting,
    matchedCategories: [...new Set([...authoritative, ...supporting].map((item) => item.route ?? item.title))],
    queryTerms,
  };
}

export function buildGroundingContext(evidence: EvidenceBundle): string {
  const cards = [...evidence.authoritative, ...evidence.supporting];
  const lines: string[] = [];
  let currentLength = 0;

  for (const card of cards) {
    const summary = compactSnippet(card.summary, GROUNDING_SUMMARY_CHARS);
    const steps = card.steps.slice(0, 2).map((step) => compactSnippet(step, GROUNDING_STEP_CHARS));
    const mistakes = card.contraindications.slice(0, 1).map((step) => compactSnippet(step, 88));

    for (const line of [summary, ...steps, ...mistakes].filter(Boolean)) {
      const formatted = `- ${line}`;
      if (currentLength + formatted.length + 1 > GROUNDING_MAX_CHARS) {
        return lines.join('\n');
      }
      lines.push(formatted);
      currentLength += formatted.length + 1;
    }
  }

  return lines.join('\n');
}

function buildClarifierResponse(request: TriageRequest, evidence: EvidenceBundle, mainRoute: CanonicalRouteHint): TriageResponse {
  const locale = request.locale;
  const rawText = composeStructuredRawText(locale, {
    currentRead: locale?.startsWith('zh')
      ? '你还没把时代和地点说清。现在给路线，等于让你拿命去试错。'
      : 'You have not pinned down the era and place yet. Giving a route now would be reckless guesswork.',
    firstMoves: locale?.startsWith('zh')
      ? [
          '先告诉我你在哪个时代，例如北宋、晚清、维多利亚时代。',
          '再告诉我具体地点，例如汴京、江南、上海、伦敦、边镇或港口。',
          '最后补上身份、手里有什么、你要首富线还是上位线。',
        ]
      : [
          'Tell me the era first: medieval England, Tudor London, Regency Britain, Victorian London, and so on.',
          'Then tell me the place: London, Edinburgh, the Highlands, a port, a frontier town, and so on.',
          'Then add your identity, starting resources, and whether you want the fortune line or the power line.',
        ],
    mainPath: locale?.startsWith('zh')
      ? `先把盘面说清，我再给你真正能走的${buildAuthoritativeLabel(locale, mainRoute)}。`
      : `State the board first, then I can draft a real ${buildAuthoritativeLabel(locale, mainRoute)} for you.`,
    doNotExpose: locale?.startsWith('zh')
      ? [
          '不要一上来就说自己来自未来。',
          '不要在没搞清礼法和势力之前抖出一大串现代名词。',
        ]
      : [
          'Do not announce that you are from the future.',
          'Do not dump modern vocabulary before you understand custom, rank, and faction.',
        ],
    askNext: locale?.startsWith('zh')
      ? '我在\\_\\_\\_，地点\\_\\_\\_，身份\\_\\_\\_，手里有\\_\\_\\_，目标是\\_\\_\\_，先给我首富线/上位线。'
      : 'I am in \\_\\_\\_, at \\_\\_\\_, my identity is \\_\\_\\_, I have \\_\\_\\_, and my goal is \\_\\_\\_. Give me the fortune line / power line first.',
  });

  return {
    summary: translateMessage(locale, 'status.context_required'),
    steps: [],
    disclaimer: translateMessage(locale, 'disclaimer.limited_evidence'),
    isKnowledgeBacked: false,
    guidanceMode: 'grounded',
    evidence,
    usedProfileName: chooseProfile(request.powerMode),
    rawText,
  };
}

function chooseProfile(powerMode: PowerMode): string {
  return powerMode === 'doomsday' ? 'gemma-4-e2b-saver' : 'gemma-4-e2b-balanced';
}

function buildAskNext(locale: string | undefined, route: RouteHint | undefined): string {
  const routeLabel = buildAuthoritativeLabel(locale, route);
  if (locale?.startsWith('zh')) {
    return `下一条就这样问：我在\\_\\_\\_，身份\\_\\_\\_，手里有\\_\\_\\_，给我更具体的${routeLabel}，按 7 天 / 30 天 / 90 天拆开。`;
  }
  return `Ask next: I am in \\_\\_\\_, my identity is \\_\\_\\_, I have \\_\\_\\_, now break the ${routeLabel} into 7-day, 30-day, and 90-day phases.`;
}

function buildRouteResponse(
  request: TriageRequest,
  evidence: EvidenceBundle,
  card: RetrievedKnowledge,
): TriageResponse {
  const locale = request.locale;
  const currentRead = compactSnippet(card.summary, 180);
  const firstMoves = firstThree((card.firstMoves?.length ?? 0) > 0 ? card.firstMoves : card.steps);
  const mainPathParts = [
    card.payoff ? compactSnippet(card.payoff, 160) : '',
    card.coverStory
      ? locale?.startsWith('zh')
        ? `掩护话术：${compactSnippet(card.coverStory, 110)}`
        : `Cover story: ${compactSnippet(card.coverStory, 110)}`
      : '',
  ].filter(Boolean);
  const doNotExpose = firstThree(
    card.contraindications.length > 0
      ? card.contraindications
      : (card.fatalMistakes ?? []),
  );

  const rawText = composeStructuredRawText(locale, {
    currentRead,
    firstMoves,
    mainPath: mainPathParts.join(locale?.startsWith('zh') ? ' ' : ' '),
    doNotExpose,
    askNext: buildAskNext(locale, card.route),
  });

  return {
    summary: currentRead,
    steps: firstMoves,
    disclaimer: translateMessage(locale, 'disclaimer.authoritative'),
    isKnowledgeBacked: true,
    guidanceMode: 'grounded',
    evidence,
    usedProfileName: chooseProfile(request.powerMode),
    rawText,
  };
}

function buildGeneralRoutePlan(route: CanonicalRouteHint, locale: string | undefined): {
  currentRead: string;
  firstMoves: string[];
  mainPath: string;
  doNotExpose: string[];
} {
  const zh = locale?.startsWith('zh');

  if (route === CANONICAL_ROUTE_HINTS.POWER) {
    return {
      currentRead: zh
        ? '你现在最该做的不是显圣，而是先变成强者离不开的那种人。'
        : 'Your first priority is not to dazzle people. It is to become useful to someone stronger than you.',
      firstMoves: zh
        ? ['先找财政、粮草、文书、情报这类能让人离不开你的差事。', '先投最缺人手的一股势力，而不是最显赫的一股。', '先积信用和名单，再谈官位和兵权。']
        : ['Move toward finance, logistics, paperwork, or intelligence work that makes you indispensable.', 'Join the faction that needs hands, not the faction that looks the grandest.', 'Accumulate trust and lists before you reach for office or soldiers.'],
      mainPath: zh
        ? '真正的上位路径通常是：先管账和人，再管物资和消息，最后才有资格碰兵权和名分。'
        : 'The usual rise-to-power line is: control ledgers and people first, then supplies and information, and only later touch soldiers and legitimacy.',
      doNotExpose: zh
        ? ['不要提前表露“我要夺权”。', '不要把未来知识一次性抖成神迹。']
        : ['Do not telegraph that you plan to seize power.', 'Do not turn your future knowledge into a public miracle too early.'],
    };
  }

  if (route === CANONICAL_ROUTE_HINTS.TECH) {
    return {
      currentRead: zh
        ? '现代知识不是一次性掀桌子的天雷，而是一连串低门槛、可复制、能赚钱的工艺差。'
        : 'Modern knowledge is not one dramatic thunderbolt. It is a chain of low-barrier, repeatable process advantages.',
      firstMoves: zh
        ? ['先挑一个低门槛工艺，不要一上来谈蒸汽机和火药。', '先把流程写成标准动作，再找最便宜的材料试样。', '先卖“更稳定、更省料、更好算账”的结果，不卖“我知道未来”。']
        : ['Pick one low-barrier process first; do not open with steam engines or gunpowder.', 'Turn it into a standard process before you buy expensive materials.', 'Sell stability, yield, and accounting discipline, not the claim that you know the future.'],
      mainPath: zh
        ? '先从账本、印刷、肥皂、包装、发酵、标准化这些轻工业和组织外挂切入，再考虑更重的制造路线。'
        : 'Start with ledgers, printing, soap, packaging, fermentation, and standardization before you attempt heavy manufacturing.',
      doNotExpose: zh
        ? ['不要在材料链没打通前吹大话。', '不要把跨时代技术说成一夜可成。']
        : ['Do not boast before the material chain exists.', 'Do not promise a cross-era leap overnight.'],
    };
  }

  if (route === CANONICAL_ROUTE_HINTS.SURVIVAL) {
    return {
      currentRead: zh
        ? '多数穿越者不是死在没本事，而是死在说错话、做错礼、太像异人。'
        : 'Most time travelers do not die for lack of talent. They die because they speak wrong, bow wrong, and look uncanny.',
      firstMoves: zh
        ? ['先学口音、称呼、礼节和银钱单位。', '先观察再开口，先抄习惯再秀本事。', '先给自己编一个稳定身份和来路。']
        : ['Learn accent, forms of address, etiquette, and money units first.', 'Watch before you speak, and imitate before you impress.', 'Build a stable identity and origin story for yourself first.'],
      mainPath: zh
        ? '真正的避坑线不是躲着不动，而是先像当地人，再像有用的人，最后才像危险的人。'
        : 'The real survival line is not hiding forever. It is looking local first, useful second, and formidable only much later.',
      doNotExpose: zh
        ? ['不要主动谈未来。', '不要在还没站稳之前显得比当地精英更懂这个世界。']
        : ['Do not volunteer future knowledge.', 'Do not look more informed than the local elite before you have footing.'],
    };
  }

  return {
    currentRead: zh
      ? '你现在最值钱的，不是某一项大发明，而是更会算账、更会标准化、更会抓信息差。'
      : 'Your most valuable edge right now is not one grand invention. It is better accounting, better standardization, and cleaner information asymmetry.',
    firstMoves: zh
      ? ['先找高频交易品和重复消费品。', '先做账、定价、包装和信誉，而不是一开始就铺大摊子。', '先赚第一桶金，再扩人脉和保护伞。']
      : ['Start with high-frequency goods and repeat consumption.', 'Lead with ledgers, pricing, packaging, and reputation before you scale.', 'Win the first fortune before you widen your network and protection.'],
    mainPath: zh
      ? '默认的穿越首富线是：小本高频生意 -> 标准化和渠道 -> 控制账本和人手 -> 再碰更大的货权与地盘。'
      : 'The default fortune line is: small high-frequency trade -> standardization and channel control -> ledgers and people -> larger control over goods and territory.',
    doNotExpose: zh
      ? ['不要空口谈巨富。', '不要把未来知识包装成天命。']
      : ['Do not brag about becoming fabulously rich too early.', 'Do not package future knowledge as a divine mandate.'],
  };
}

function buildAiBestEffortResponse(
  request: TriageRequest,
  evidence: EvidenceBundle,
  route: CanonicalRouteHint,
): TriageResponse {
  const plan = buildGeneralRoutePlan(route, request.locale);
  const rawText = composeStructuredRawText(request.locale, {
    currentRead: plan.currentRead,
    firstMoves: plan.firstMoves,
    mainPath: plan.mainPath,
    doNotExpose: plan.doNotExpose,
    askNext: buildAskNext(request.locale, route),
  });

  return {
    summary: plan.currentRead,
    steps: plan.firstMoves,
    disclaimer: translateMessage(request.locale, 'disclaimer.limited_evidence'),
    isKnowledgeBacked: false,
    guidanceMode: 'grounded',
    evidence,
    usedProfileName: chooseProfile(request.powerMode),
    rawText,
  };
}

export function inferTriageResponse(request: TriageRequest): TriageResponse {
  const rawCategoryHint = request.categoryHint?.trim() ?? '';
  const rawQuery = [rawCategoryHint, request.userText].filter(Boolean).join(' ').trim();
  const explicitRoute = normalizeScenarioHint(rawCategoryHint);
  const routes = inferRouteHints(rawQuery, explicitRoute);
  const mainRoute = pickMainRoute(routes, rawQuery);
  const evidence = retrieveEvidenceBundle(request);

  if (!hasEraAndPlaceContext(explicitRoute, rawQuery)) {
    return buildClarifierResponse(request, evidence, mainRoute);
  }

  const primaryCard = evidence.authoritative[0] ?? evidence.supporting[0];
  if (primaryCard) {
    return buildRouteResponse(request, evidence, primaryCard);
  }

  return buildAiBestEffortResponse(request, evidence, mainRoute);
}

export async function warmKnowledgeEngine(): Promise<void> {
  await ensureKnowledgeBaseLoaded();
}

export function splitStreamingTokens(response: TriageResponse): string[] {
  const text = response.rawText ?? [response.summary, ...response.steps].join('\n');
  return text
    .split(/(?<=\n|。|！|!|？|\?)/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function estimateSosState(summary: string, active: boolean): SosState {
  return {
    active,
    connectedPeers: active ? Math.min(12, Math.max(2, Math.ceil(summary.length / 8))) : 0,
    lastBroadcastAt: active ? new Date().toISOString() : undefined,
  };
}

export async function* simulateDownload(
  modelId: string,
): AsyncIterable<ModelDownloadProgress> {
  const totalBytes = 100;
  for (const [index, receivedBytes] of [20, 45, 72, 100].entries()) {
    await sleep(150);
    yield {
      modelId,
      receivedBytes,
      totalBytes,
      fraction: receivedBytes / totalBytes,
      isResumed: receivedBytes > 20,
      status: index === 0 ? 'in_progress' : receivedBytes === 100 ? 'succeeded' : 'in_progress',
      bytesPerSecond: receivedBytes === 100 ? 0 : 160,
      remainingMs: receivedBytes === 100 ? 0 : Math.max(0, ((totalBytes - receivedBytes) / 160) * 1000),
    };
  }
}
