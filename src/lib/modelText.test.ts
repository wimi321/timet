import { describe, expect, it } from 'vitest';
import type { TriageResponse } from './types';
import {
  buildDisplayResponseText,
  formatModelTextForDisplay,
  processModelResponse,
  splitModelResponseText,
} from './modelText';

function createResponse(overrides?: Partial<TriageResponse>): TriageResponse {
  return {
    summary: 'Stay calm.',
    steps: [],
    disclaimer: '',
    isKnowledgeBacked: false,
    guidanceMode: 'grounded',
    evidence: {
      authoritative: [],
      supporting: [],
      matchedCategories: [],
      queryTerms: [],
    },
    usedProfileName: 'Gemma 4 E2B',
    ...overrides,
  };
}

describe('processModelResponse', () => {
  it('only restores escaped newlines and strips control chars', () => {
    expect(processModelResponse('Line 1\\n\\n1. Step one\u0007')).toBe('Line 1\n\n1. Step one');
  });
});

describe('formatModelTextForDisplay', () => {
  it('preserves markdown syntax instead of rewriting it', () => {
    expect(formatModelTextForDisplay('*Keep cover*\n\n1. Build trust')).toBe(
      '*Keep cover*\n\n1. Build trust',
    );
  });

  it('promotes inline numbered guidance into readable markdown blocks', () => {
    expect(
      formatModelTextForDisplay(
        '按这条首富线先走：1. **局面判断：**先稳住身份和现金流。2. **先走三步：**记账、定价、找熟客。**核心原则：**先发财，再上位。',
      ),
    ).toBe(
      '按这条首富线先走：\n\n1. **局面判断：** 先稳住身份和现金流。\n2. **先走三步：** 记账、定价、找熟客。\n\n**核心原则：** 先发财，再上位。',
    );
  });
});

describe('splitModelResponseText', () => {
  it('keeps a simple compatibility split for summary and steps', () => {
    const parsed = splitModelResponseText(
      'Start with trust.\\n1. Keep clean ledgers\\n2. Find repeat customers',
    );

    expect(parsed.summary).toBe('Start with trust.');
    expect(parsed.steps).toEqual(['1. Keep clean ledgers', '2. Find repeat customers']);
  });
});

describe('buildDisplayResponseText', () => {
  it('prefers raw response text when native provides it', () => {
    const response = createResponse({
      summary: 'Fallback summary',
      steps: ['Fallback step'],
    }) as TriageResponse & { rawText?: string };
    response.rawText = 'Current Read\\n\\n1. Start with ledgers';

    expect(buildDisplayResponseText(response)).toBe('Current Read\n\n1. Start with ledgers');
  });
});
