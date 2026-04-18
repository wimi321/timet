import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCapacitorBeaconBridge } from './capacitorBridge';
import { NativeBeacon } from './nativeBeaconPlugin';
import type { TriageResponse } from './types';

const nativeState = vi.hoisted(() => {
  let streamListener:
    | ((event: {
        streamId: string;
        delta?: string;
        done?: boolean;
        error?: string;
        finalText?: string;
        usedProfileName?: string;
      }) => void)
    | undefined;

  return {
    get listener() {
      return streamListener;
    },
    setListener(listener: typeof streamListener) {
      streamListener = listener;
    },
    removeListener() {
      streamListener = undefined;
    },
  };
});

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
  },
}));

vi.mock('@capacitor/device', () => ({
  Device: {
    getBatteryInfo: vi.fn(),
  },
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    getCurrentPosition: vi.fn(),
  },
}));

vi.mock('@capacitor/haptics', () => ({
  ImpactStyle: {
    Light: 'LIGHT',
    Medium: 'MEDIUM',
    Heavy: 'HEAVY',
  },
  Haptics: {
    impact: vi.fn(async () => undefined),
  },
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn(async () => ({ connected: false })),
  },
}));

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async () => ({ value: null })),
    set: vi.fn(async () => undefined),
  },
}));

vi.mock('./beaconEngine', () => ({
  buildGroundingContext: vi.fn(() => 'grounding-context'),
  estimateSosState: vi.fn(),
  retrieveEvidenceBundle: vi.fn(() => ({
    authoritative: [
      {
        id: 'auth-1',
        sourceId: 'merchant-ladders',
        title: 'Treaty Port First Fortune Line',
        source: 'Timet Curated Pack: Treaty Port Acceleration Playbooks',
        summary: 'Win the first fortune through brokerage and clean settlement.',
        steps: ['Own the paperwork before you own the warehouse.'],
        contraindications: [],
        escalation: 'Move upstream after trust hardens.',
        strategy: 'lexical',
        score: 0.99,
        route: 'wealth',
      },
    ],
    supporting: [],
    matchedCategories: ['wealth'],
    queryTerms: ['wealth'],
  })),
  warmKnowledgeEngine: vi.fn(async () => undefined),
}));

vi.mock('./nativeBeaconPlugin', () => ({
  NativeBeacon: {
    addListener: vi.fn(async (eventName: string, listener: typeof nativeState.listener) => {
      if (eventName === 'triageStreamEvent') {
        nativeState.setListener(listener);
      }
      return {
        remove: vi.fn(async () => {
          nativeState.removeListener();
        }),
      };
    }),
    analyzeVisual: vi.fn(),
    downloadModel: vi.fn(),
    getRuntimeDiagnostics: vi.fn(),
    listModels: vi.fn(async () => ({ models: [] })),
    loadModel: vi.fn(async () => ({ models: [] })),
    triage: vi.fn(),
    triageStream: vi.fn(async ({ streamId }: { streamId?: string }) => {
      queueMicrotask(() => {
        nativeState.listener?.({
          streamId: streamId ?? 'missing-stream',
          delta: 'Current Read\n',
        });
        nativeState.listener?.({
          streamId: streamId ?? 'missing-stream',
          delta: 'Riches first, power later.',
        });
        nativeState.listener?.({
          streamId: streamId ?? 'missing-stream',
          done: true,
          finalText: 'Current Read\nRiches first, power later.',
          usedProfileName: 'gemma-4-e2b-balanced',
        });
      });
      return { streamId: streamId ?? 'missing-stream' };
    }),
  },
}));

describe('CapacitorBeaconBridge', () => {
  beforeEach(() => {
    nativeState.removeListener();
    vi.clearAllMocks();
  });

  it('yields native stream deltas before the final response', async () => {
    const bridge = createCapacitorBeaconBridge();
    const chunks: Array<{ delta: string; done?: boolean; finalSummary?: string }> = [];

    for await (const chunk of bridge.triageStream({
      userText: 'Regency London, junior clerk, how do I gain wealth fast?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'stream-test-session',
    })) {
      chunks.push({
        delta: chunk.delta,
        done: chunk.done,
        finalSummary: chunk.final?.summary,
      });
    }

    expect(chunks[0]).toMatchObject({ delta: 'Current Read\n' });
    expect(chunks[1]).toMatchObject({ delta: 'Riches first, power later.' });
    expect(chunks[2]).toMatchObject({
      delta: '',
      done: true,
      finalSummary: 'Current Read',
    });
  });

  it('sends the new visual-clue fallback prompt when an image is present', async () => {
    vi.mocked(NativeBeacon.analyzeVisual).mockResolvedValue({
      text: 'Current Read\n1. Inspect the script style.',
      modelId: 'gemma-4-e2b',
      usedProfileName: 'gemma-4-e2b-balanced',
    });

    const bridge = createCapacitorBeaconBridge();
    await bridge.analyzeVisual({
      userText: '',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'visual-test-session',
      imageBase64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
    });

    expect(NativeBeacon.analyzeVisual).toHaveBeenCalledWith(
      expect.objectContaining({
        userText: 'What era clues do you see here, and what should I ask next?',
        imageBase64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
      }),
    );
  });

  it('preserves a user-written visual question', async () => {
    vi.mocked(NativeBeacon.analyzeVisual).mockResolvedValue({
      text: 'Current Read\n1. Count the repeated seal marks.',
      modelId: 'gemma-4-e2b',
      usedProfileName: 'gemma-4-e2b-balanced',
    });

    const bridge = createCapacitorBeaconBridge();
    await bridge.analyzeVisual({
      userText: 'What does this coin tell me about the era?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'visual-custom-question-session',
      imageBase64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
    });

    expect(NativeBeacon.analyzeVisual).toHaveBeenCalledWith(
      expect.objectContaining({
        userText: 'What does this coin tell me about the era?',
      }),
    );
  });

  it('localizes the disclaimer to Timet route wording', async () => {
    vi.mocked(NativeBeacon.triage).mockResolvedValue({
      text: 'Current Read\n1. Start with brokerage.',
      modelId: 'gemma-4-e2b',
      usedProfileName: 'gemma-4-e2b-balanced',
    });

    const bridge = createCapacitorBeaconBridge();
    const response = await bridge.triage({
      userText: 'Regency London, a few guineas, what is my first fortune line?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'localized-disclaimer-session',
    });

    expect(response.disclaimer).toContain('Timet knowledge pack');
    expect(response.disclaimer).not.toContain('此回答');
  });

  it('preserves native final text for display formatting', async () => {
    vi.mocked(NativeBeacon.triageStream).mockImplementationOnce(async ({ streamId }: { streamId?: string }) => {
      queueMicrotask(() => {
        nativeState.listener?.({
          streamId: streamId ?? 'missing-stream',
          delta: '\nCurrent Read',
        });
        nativeState.listener?.({
          streamId: streamId ?? 'missing-stream',
          done: true,
          finalText: '\nCurrent Read\n\n- Start with ledgers\n',
          usedProfileName: 'gemma-4-e2b-balanced',
        });
      });
      return { streamId: streamId ?? 'missing-stream' };
    });

    const bridge = createCapacitorBeaconBridge();
    let finalResponse: TriageResponse | undefined;

    for await (const chunk of bridge.triageStream({
      userText: 'Victorian London, literate, a little capital, what is my first path?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'final-text-session',
    })) {
      if (chunk.final) {
        finalResponse = chunk.final;
      }
    }

    expect(finalResponse?.rawText).toContain('- Start with ledgers');
  });
});
