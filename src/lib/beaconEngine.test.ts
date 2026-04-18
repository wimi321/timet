import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildGroundingContext,
  inferTriageResponse,
  retrieveEvidenceBundle,
  warmKnowledgeEngine,
} from './beaconEngine';

describe('beaconEngine', () => {
  beforeAll(async () => {
    await warmKnowledgeEngine();
  });

  it('routes a Chinese Northern Song question into the fortune line', () => {
    const response = inferTriageResponse({
      userText: '我在北宋汴京，识字，有一点碎银，怎么先做首富？',
      powerMode: 'normal',
      locale: 'zh-CN',
      sessionId: 'engine-song-wealth',
    });

    expect(response.isKnowledgeBacked).toBe(true);
    expect(response.evidence.authoritative[0]?.route).toBe('wealth');
    expect(response.rawText).toContain('局面判断');
    expect(response.rawText).toContain('先走三步');
  });

  it('surfaces power evidence for an English Tudor court-city query', () => {
    const evidence = retrieveEvidenceBundle({
      userText: 'Tudor London, I serve in a noble household. How do I gain influence without getting crushed?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'engine-tudor-power',
    });

    const routes = new Set(
      [...evidence.authoritative, ...evidence.supporting]
        .map((item) => item.route)
        .filter((item): item is NonNullable<typeof item> => item != null),
    );

    expect(routes.has('power')).toBe(true);
  });

  it('returns a short clarifier when era or place is missing', () => {
    const response = inferTriageResponse({
      userText: 'I want the fastest route to money.',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'engine-missing-context',
    });

    expect(response.isKnowledgeBacked).toBe(false);
    expect(response.summary).toBe('Need era and place');
    expect(response.rawText).toContain('You have not pinned down the era and place yet');
  });

  it('allows visual-clue requests without forcing era detection first', () => {
    const response = inferTriageResponse({
      userText: '',
      categoryHint: 'visual_help',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'engine-visual-help',
    });

    expect(response.rawText).toContain('Current Read');
    expect(response.rawText).toContain('Ask Me Next');
  });

  it('prefers Chinese cards for Chinese locale and English cards for English locale', () => {
    const zh = inferTriageResponse({
      userText: '我在晚清上海，有一点本钱，哪些现代知识最先能变成真钱？',
      powerMode: 'normal',
      locale: 'zh-CN',
      sessionId: 'engine-zh-locale',
    });
    const en = inferTriageResponse({
      userText: 'Victorian London with a little capital. Which modern methods can I turn into real money first?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'engine-en-locale',
    });

    expect(/[一-龥]/.test(zh.summary)).toBe(true);
    expect(/[A-Za-z]/.test(en.summary)).toBe(true);
    expect(zh.summary).not.toBe(en.summary);
  });

  it('keeps grounding compact for local prompt budgets', () => {
    const evidence = retrieveEvidenceBundle({
      userText: 'Regency London, basic literacy, a few guineas, I want wealth and influence fast.',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'engine-grounding',
    });

    const grounding = buildGroundingContext(evidence);
    expect(grounding.length).toBeLessThanOrEqual(860);
    expect(grounding).toContain('- ');
  });
});
