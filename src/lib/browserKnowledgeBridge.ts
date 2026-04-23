import type {
  BatteryStatus,
  ModelDescriptor,
  ModelDownloadProgress,
  PowerMode,
  RuntimeDiagnostics,
  SosRequest,
  SosState,
  TriageRequest,
  TriageResponse,
} from './types';
import type { BeaconBridge, StreamChunk } from './beaconBridge';
import {
  estimateSosState,
  inferTriageResponse,
  sleep,
  splitStreamingTokens,
  warmKnowledgeEngine,
} from './beaconEngine';

const WEB_MODEL_ID = 'timet-web-knowledge';

function createWebKnowledgeModel(): ModelDescriptor {
  return {
    id: WEB_MODEL_ID,
    tier: 'e2b',
    name: 'Timet Web Knowledge Pack',
    localPath: 'browser://timet-knowledge',
    sizeLabel: 'Browser route preview',
    isLoaded: true,
    isDownloaded: true,
    sizeBytes: 0,
    defaultProfileName: 'browser-route-preview',
    recommendedFor: 'Web preview and local knowledge-pack verification',
    supportsImageInput: false,
    supportsVision: false,
    acceleratorHints: ['browser'],
    activeBackend: 'browser-knowledge',
    activeVisionBackend: 'text-only',
    acceleratorFamily: 'unknown',
    downloadStatus: 'succeeded',
    artifactFormat: 'unknown',
    runtimeStack: 'unknown',
    capabilityClass: 'supported',
    supportedDeviceClass: 'unknown',
    preferredBackend: 'unknown',
  };
}

class BrowserKnowledgeBridge implements BeaconBridge {
  private powerMode: PowerMode = 'normal';
  private sosState: SosState = { active: false, connectedPeers: 0 };
  private model: ModelDescriptor = createWebKnowledgeModel();

  async initialize(): Promise<void> {
    await warmKnowledgeEngine();
  }

  async triage(request: TriageRequest): Promise<TriageResponse> {
    await warmKnowledgeEngine();
    return inferTriageResponse(request);
  }

  async *triageStream(request: TriageRequest): AsyncIterable<StreamChunk> {
    const response = await this.triage(request);

    for (const token of splitStreamingTokens(response)) {
      await sleep(90);
      yield { delta: token };
    }

    yield { delta: '', done: true, final: response };
  }

  async cancelActiveInference(): Promise<void> {}

  async analyzeVisual(request: TriageRequest): Promise<TriageResponse> {
    return this.triage({
      ...request,
      userText:
        request.userText.trim() ||
        'What visible clues should I inspect to identify the era, place, or social rank?',
      categoryHint: request.categoryHint ?? 'visual_help',
    });
  }

  async toggleSos(request: SosRequest): Promise<SosState> {
    this.sosState = estimateSosState(request.summary, !this.sosState.active);
    return this.sosState;
  }

  async getBatteryStatus(): Promise<BatteryStatus> {
    return {
      level: 1,
      isLowPowerMode: this.powerMode === 'doomsday',
      forcedPowerMode: this.powerMode,
    };
  }

  async setPowerMode(mode: PowerMode): Promise<BatteryStatus> {
    this.powerMode = mode;
    return this.getBatteryStatus();
  }

  async getRuntimeDiagnostics(): Promise<RuntimeDiagnostics> {
    return {
      platform: 'web',
      loadedModelId: this.model.id,
      isLoaded: true,
      activeBackend: 'browser-knowledge',
      activeVisionBackend: 'text-only',
      acceleratorFamily: 'unknown',
      runtimeStack: 'unknown',
      artifactFormat: 'unknown',
      capabilityClass: 'supported',
      gpuEligible: false,
      gpuWarmupPassed: false,
      gpuWarmupAttempted: false,
      supportedDeviceClass: 'unknown',
      preferredBackend: 'unknown',
    };
  }

  async listModels(): Promise<ModelDescriptor[]> {
    return [{ ...this.model }];
  }

  async loadModel(_modelId: string): Promise<ModelDescriptor[]> {
    this.model = {
      ...this.model,
      isLoaded: true,
      isDownloaded: true,
      downloadStatus: 'succeeded',
    };
    return this.listModels();
  }

  async *downloadModel(modelId: string): AsyncIterable<ModelDownloadProgress> {
    yield {
      modelId,
      receivedBytes: 1,
      totalBytes: 1,
      fraction: 1,
      isResumed: false,
      status: 'succeeded',
      bytesPerSecond: 0,
      remainingMs: 0,
    };
  }
}

export function createBrowserKnowledgeBridge(): BeaconBridge {
  return new BrowserKnowledgeBridge();
}
