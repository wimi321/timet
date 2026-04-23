import { describe, expect, it } from 'vitest';
import { createBrowserKnowledgeBridge } from './browserKnowledgeBridge';
import { formatModelSizeLabel } from './appHelpers';

const t = ((key: string) => key) as Parameters<typeof formatModelSizeLabel>[1];

describe('BrowserKnowledgeBridge', () => {
  it('answers concrete web prompts from the offline route pack', async () => {
    const bridge = createBrowserKnowledgeBridge();
    await bridge.initialize();

    const response = await bridge.triage({
      userText:
        'Regency London, literate clerk, a few guineas, how do I build my first fortune in 90 days?',
      powerMode: 'normal',
      locale: 'en',
      sessionId: 'browser-regency-wealth',
    });

    expect(response.guidanceMode).toBe('grounded');
    expect(response.isKnowledgeBacked).toBe(true);
    expect(response.rawText).toContain('Current Read');
    expect(response.evidence.authoritative[0]?.route).toBe('wealth');
  });

  it('exposes a loaded browser preview model instead of asking users to download native assets', async () => {
    const bridge = createBrowserKnowledgeBridge();
    const models = await bridge.listModels();
    const diagnostics = await bridge.getRuntimeDiagnostics();

    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      id: 'timet-web-knowledge',
      isLoaded: true,
      isDownloaded: true,
      downloadStatus: 'succeeded',
    });
    expect(formatModelSizeLabel(models[0], t)).toBe('Browser route preview');
    expect(diagnostics.activeBackend).toBe('browser-knowledge');
  });
});
