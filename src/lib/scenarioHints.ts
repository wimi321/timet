import { messages, type TranslationKey } from '../i18n/messages';
import type { RouteHint } from './types';

export const CANONICAL_ROUTE_HINTS = {
  WEALTH: 'wealth',
  POWER: 'power',
  SURVIVAL: 'survival',
  TECH: 'tech',
  VISUAL_HELP: 'visual_help',
} as const satisfies Record<string, RouteHint>;

export type CanonicalRouteHint =
  typeof CANONICAL_ROUTE_HINTS[keyof typeof CANONICAL_ROUTE_HINTS];

type RouteDefinition = {
  translationKey: TranslationKey;
  primaryCategories: string[];
  retrievalTerms: string[];
  extraAliases: string[];
};

const ROUTE_DEFINITIONS: Record<CanonicalRouteHint, RouteDefinition> = {
  [CANONICAL_ROUTE_HINTS.WEALTH]: {
    translationKey: 'route.wealth.label',
    primaryCategories: ['首富线', 'Fortune Line'],
    retrievalTerms: [
      '发财',
      '赚钱',
      '生意',
      '商路',
      'merchant',
      'business',
      'profit',
      'fortune',
      'trade',
      'arbitrage',
      'pricing',
      'ledger',
    ],
    extraAliases: [
      'wealth',
      'riches',
      'fortune line',
      'money line',
      'become rich',
      'first fortune',
    ],
  },
  [CANONICAL_ROUTE_HINTS.POWER]: {
    translationKey: 'route.power.label',
    primaryCategories: ['上位线', 'Power Line'],
    retrievalTerms: [
      '上位',
      '掌权',
      '官场',
      '宫廷',
      '结盟',
      '皇帝',
      '称王',
      'court',
      'faction',
      'patronage',
      'office',
      'governance',
      'throne',
      'power',
    ],
    extraAliases: [
      'power',
      'power line',
      'rise to power',
      'throne line',
      'politics',
      'court line',
    ],
  },
  [CANONICAL_ROUTE_HINTS.SURVIVAL]: {
    translationKey: 'route.survival.label',
    primaryCategories: ['避坑线', 'Fatal Mistakes'],
    retrievalTerms: [
      '保命',
      '藏锋',
      '别暴露',
      '融入',
      '礼仪',
      '口音',
      'fatal mistake',
      'blend in',
      'cover story',
      'do not expose',
      'custom',
      'etiquette',
    ],
    extraAliases: [
      'survival',
      'fatal mistakes',
      'blend in',
      'hide the anomaly',
      'avoid suspicion',
    ],
  },
  [CANONICAL_ROUTE_HINTS.TECH]: {
    translationKey: 'route.tech.label',
    primaryCategories: ['现代知识外挂', 'Modern Edge'],
    retrievalTerms: [
      '技术',
      '发明',
      '工艺',
      '肥皂',
      '玻璃',
      '印刷',
      '记账',
      '组织',
      'technology',
      'modern edge',
      'printing',
      'soap',
      'glass',
      'process',
      'standardization',
    ],
    extraAliases: [
      'tech',
      'technology',
      'modern edge',
      'modern knowledge',
      'industrial shortcut',
    ],
  },
  [CANONICAL_ROUTE_HINTS.VISUAL_HELP]: {
    translationKey: 'action.visual_help',
    primaryCategories: ['视觉线索', 'Visual Clues'],
    retrievalTerms: [
      'coin',
      'script',
      'seal',
      'garment',
      'artifact',
      'tool',
      'insignia',
      '钱币',
      '文字',
      '器物',
      '印章',
      '服饰',
    ],
    extraAliases: [
      'visual help',
      'scan clue',
      'camera help',
      'image clue',
    ],
  },
};

function normalizeRouteToken(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_/|]+/g, ' ')
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function registerAlias(
  aliasIndex: Map<string, CanonicalRouteHint>,
  alias: string,
  route: CanonicalRouteHint,
): void {
  const normalized = normalizeRouteToken(alias);
  if (!normalized) {
    return;
  }

  aliasIndex.set(normalized, route);

  const compact = normalized.replace(/\s+/g, '');
  if (compact && compact !== normalized) {
    aliasIndex.set(compact, route);
  }
}

function buildRouteAliasIndex(): Map<string, CanonicalRouteHint> {
  const aliasIndex = new Map<string, CanonicalRouteHint>();

  for (const [route, definition] of Object.entries(ROUTE_DEFINITIONS) as Array<
    [CanonicalRouteHint, RouteDefinition]
  >) {
    registerAlias(aliasIndex, route, route);

    for (const primaryCategory of definition.primaryCategories) {
      registerAlias(aliasIndex, primaryCategory, route);
    }

    for (const alias of definition.extraAliases) {
      registerAlias(aliasIndex, alias, route);
    }

    const translatedLabels = Object.values(messages)
      .map((dictionary) => dictionary[definition.translationKey])
      .filter((label): label is string => typeof label === 'string' && label.trim().length > 0);

    for (const translatedLabel of translatedLabels) {
      registerAlias(aliasIndex, translatedLabel, route);
    }
  }

  return aliasIndex;
}

const ROUTE_ALIAS_INDEX = buildRouteAliasIndex();

export function normalizeScenarioHint(hint?: string | null): CanonicalRouteHint | null {
  const normalized = normalizeRouteToken(hint ?? '');
  if (!normalized) {
    return null;
  }

  return ROUTE_ALIAS_INDEX.get(normalized)
    ?? ROUTE_ALIAS_INDEX.get(normalized.replace(/\s+/g, ''))
    ?? null;
}

export function getScenarioPrimaryCategories(
  route: CanonicalRouteHint | null | undefined,
): string[] {
  if (!route) {
    return [];
  }
  return [...ROUTE_DEFINITIONS[route].primaryCategories];
}

export function getScenarioRetrievalTerms(
  route: CanonicalRouteHint | null | undefined,
): string[] {
  if (!route) {
    return [];
  }

  const definition = ROUTE_DEFINITIONS[route];
  return [...definition.primaryCategories, ...definition.retrievalTerms];
}
