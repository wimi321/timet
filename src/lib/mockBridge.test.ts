import { describe, expect, it } from 'vitest';
import { createMockBeaconBridge } from './mockBridge';

describe('MockBeaconBridge', () => {
  it('returns a grounded route for a concrete historical question', async () => {
    const bridge = createMockBeaconBridge();
    const response = await bridge.triage({
      userText: '我在北宋汴京，识字，有一点碎银，怎么先做首富？',
      powerMode: 'normal',
      locale: 'zh-CN',
      sessionId: 'mock-song-wealth',
    });

    expect(response.guidanceMode).toBe('grounded');
    expect(response.isKnowledgeBacked).toBe(true);
    expect(response.evidence.authoritative[0]?.route).toBe('wealth');
  });

  it('asks for context instead of guessing when era and place are missing', async () => {
    const bridge = createMockBeaconBridge();
    const response = await bridge.triage({
      userText: 'Need the fastest path to money.',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'mock-missing-context',
    });

    expect(response.isKnowledgeBacked).toBe(false);
    expect(response.summary).toBe('Need era and place');
  });

  it('uses a visual-clue fallback prompt for image analysis', async () => {
    const bridge = createMockBeaconBridge();
    const response = await bridge.analyzeVisual({
      userText: '',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'mock-visual',
      imageBase64: 'ZmFrZS1pbWFnZS1ieXRlcw==',
    });

    expect(response.rawText).toContain('Current Read');
    expect(response.rawText).toContain('Ask Me Next');
  });

  it('localizes low-battery warnings from warning codes', async () => {
    const bridge = createMockBeaconBridge();
    await bridge.setPowerMode('doomsday');
    await bridge.triage({
      userText: 'Regency London, a few guineas, what is my first fortune line?',
      powerMode: 'doomsday',
      locale: 'en',
      sessionId: 'mock-battery',
    });

    const battery = await bridge.getBatteryStatus();
    expect(battery.warningCode).toBe('battery.low_power_emergency');
    expect(battery.warning).toContain('Battery');
  });

  it('exposes runtime diagnostics for verification hooks', async () => {
    const bridge = createMockBeaconBridge();
    const diagnostics = await bridge.getRuntimeDiagnostics();

    expect(diagnostics.platform).toBe('web');
    expect(diagnostics.activeBackend).toBe('mock');
    expect(diagnostics.acceleratorFamily).toBe('unknown');
  });
});
