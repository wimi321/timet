import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { LoaderCircle, Zap } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NavBar } from './components/NavBar';
import { HeroPanel } from './components/HeroPanel';
import { RouteGrid } from './components/RouteGrid';
import { ChatMessages } from './components/ChatMessages';
import { ChatInputBar } from './components/ChatInputBar';
import { ModelPanel } from './components/ModelPanel';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useI18n } from './i18n';
import { useHaptics } from './hooks/useHaptics';
import { brandTitleForLocale } from './lib/brand';
import {
  formatModelTextForDisplay,
  hasMeaningfulModelText,
} from './lib/modelText';
import { getBeaconBridge } from './lib/runtime';
import { CANONICAL_ROUTE_HINTS } from './lib/scenarioHints';
import {
  attachTriageSession,
  consumeTriageSessionReset,
  createTriageSessionState,
  resetTriageSessionState,
} from './lib/session';
import {
  buildAiMessage,
  chooseAlternateDownloadModel,
  choosePreferredReadyModel,
  chooseRecommendedDownloadModel,
  createId,
  extractErrorMessage,
  formatResponseText,
  hasDownloadedModel,
  hasLoadedModel,
  isCancelledCameraCapture,
  isNativeAndroidApp,
  isPreparingModel,
  localizeModelLoadFailure,
  needsBundledModelRecovery,
  recoverBundledModelState,
  resolveBatteryWarning,
  shouldKeepWaitingForBundledModel,
  shouldStopAutoModelRetry,
  sleep,
  STREAM_UI_FLUSH_INTERVAL_MS,
} from './lib/appHelpers';
import type {
  BatteryStatus,
  BeaconMessage,
  ModelDescriptor,
  PowerMode,
  TriageResponse,
} from './lib/types';

export default function App() {
  const { t, locale } = useI18n();
  const bridge = useMemo(() => getBeaconBridge(), []);
  const haptics = useHaptics();

  const routeActions = useMemo(() => [
    {
      label: t('route.wealth.label'),
      description: t('route.wealth.text'),
      icon: '💰',
      categoryHint: CANONICAL_ROUTE_HINTS.WEALTH,
      userText: locale.startsWith('zh')
        ? '我在北宋汴京，识字，有一点碎银，怎么三个月赚到第一桶金？'
        : 'Regency London, literate clerk, a few guineas, how do I build my first fortune in 90 days?',
    },
    {
      label: t('route.power.label'),
      description: t('route.power.text'),
      icon: '👑',
      categoryHint: CANONICAL_ROUTE_HINTS.POWER,
      userText: locale.startsWith('zh')
        ? '我在晚清上海通商口岸，给商号跑单，怎样先结交靠山再上位？'
        : 'Tudor London, I serve in a noble household. How do I gain influence without getting crushed?',
    },
    {
      label: t('route.survival.label'),
      description: t('route.survival.text'),
      icon: '🗡️',
      categoryHint: CANONICAL_ROUTE_HINTS.SURVIVAL,
      userText: locale.startsWith('zh')
        ? '我在南宋临安，刚到陌生城里，没有靠山，最先不能暴露什么？'
        : 'I just arrived in medieval London with no patron. What must I hide first to blend in?',
    },
    {
      label: t('route.tech.label'),
      description: t('route.tech.text'),
      icon: '⚙️',
      categoryHint: CANONICAL_ROUTE_HINTS.TECH,
      userText: locale.startsWith('zh')
        ? '我在晚清上海，有一点本钱，哪些现代知识最先能变成真钱？'
        : 'Victorian London, a little capital. Which modern methods can I turn into real money first?',
    },
  ], [locale, t]);

  const [messages, setMessages] = useState<BeaconMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showModelManager, setShowModelManager] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [batteryStatus, setBatteryStatus] = useState<BatteryStatus | null>(null);
  const [powerMode, setPowerMode] = useState<PowerMode>('normal');
  const [models, setModels] = useState<ModelDescriptor[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [modelLoadFailure, setModelLoadFailure] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState(t('status.offline_ready'));
  const [triageSession, setTriageSession] = useState(createTriageSessionState);
  const [isRecoveringModel, setIsRecoveringModel] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const modelsRef = useRef<ModelDescriptor[]>([]);
  const bootPromiseRef = useRef<Promise<void> | null>(null);
  const activeInferenceRunRef = useRef(0);
  const modelRequiredMessage = t('status.model_required');
  const modelPreparingMessage = t('status.model_preparing');
  const hasMessages = messages.length > 0;

  function beginInferenceRun(): number {
    activeInferenceRunRef.current += 1;
    return activeInferenceRunRef.current;
  }

  function invalidateInferenceRun(): number {
    activeInferenceRunRef.current += 1;
    return activeInferenceRunRef.current;
  }

  function isInferenceRunActive(runId: number): boolean {
    return activeInferenceRunRef.current === runId;
  }

  function resetConversationUiState(): void {
    setMessages([]);
    setChatInput('');
    setTriageSession(resetTriageSessionState());
    setIsStreaming(false);
    setStatusLine(modelLoadFailure ?? t('status.offline_ready'));
  }

  function closeModelManager(): void {
    setShowModelManager(false);
  }

  useEffect(() => {
    document.title = brandTitleForLocale(locale);
  }, [locale]);

  useEffect(() => {
    setStatusLine(modelLoadFailure ?? t('status.offline_ready'));
  }, [modelLoadFailure, t]);

  useEffect(() => {
    let isCancelled = false;

    const boot = async () => {
      try {
        await bridge.initialize();
        const [initialBattery, listedModels] = await Promise.all([
          bridge.getBatteryStatus(),
          bridge.listModels(),
        ]);
        const initialModels = needsBundledModelRecovery(listedModels)
          ? await recoverBundledModelState(bridge)
          : listedModels;

        if (isCancelled) {
          return;
        }

        modelsRef.current = initialModels;
        setBatteryStatus(initialBattery);
        setPowerMode(initialBattery.forcedPowerMode);
        setModels(initialModels);

        if (shouldKeepWaitingForBundledModel(initialModels)) {
          setStatusLine(modelPreparingMessage);
        } else if (!hasDownloadedModel(initialModels)) {
          setShowModelManager(true);
          setStatusLine(modelRequiredMessage);
        }

        const initialWarning = resolveBatteryWarning(initialBattery, t);
        if (initialWarning) {
          setMessages((prev) => [
            ...prev,
            { id: createId('system'), sender: 'system', text: initialWarning },
          ]);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = extractErrorMessage(error) || t('status.infer_failed');
        setMessages((prev) => [
          ...prev,
          { id: createId('system'), sender: 'system', text: t('error.generic', { message }) },
        ]);
        setStatusLine(t('status.infer_failed'));
      } finally {
        if (!isCancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    const bootPromise = boot();
    bootPromiseRef.current = bootPromise;

    return () => {
      isCancelled = true;
    };
  }, [bridge, modelPreparingMessage, modelRequiredMessage, t]);

  useEffect(() => {
    modelsRef.current = models;
  }, [models]);

  useEffect(() => {
    if (isBootstrapping || modelLoadFailure != null) {
      return undefined;
    }

    let isCancelled = false;
    let timerId: number | undefined;

    const syncNativeModelState = async (): Promise<void> => {
      let stopAutoRetry = false;

      try {
        const listedModels = await bridge.listModels();
        const nextModels = needsBundledModelRecovery(listedModels)
          ? await recoverBundledModelState(bridge)
          : listedModels;

        if (isCancelled) {
          return;
        }

        modelsRef.current = nextModels;
        setModels(nextModels);

        const waitingForBundledModel = shouldKeepWaitingForBundledModel(nextModels);
        const loaded = hasLoadedModel(nextModels);
        const readyModel = choosePreferredReadyModel(nextModels);

        if (waitingForBundledModel) {
          setStatusLine(modelPreparingMessage);
        } else if (readyModel && !loaded) {
          const loadedModels = await bridge.loadModel(readyModel.id);
          if (isCancelled) {
            return;
          }
          modelsRef.current = loadedModels;
          setModels(loadedModels);
          setModelLoadFailure(null);
          setStatusLine(t('status.model_switched'));
          closeModelManager();
        } else if (!readyModel && nextModels.length > 0) {
          setShowModelManager(true);
          setStatusLine(modelRequiredMessage);
        }
      } catch (error) {
        if (!isCancelled) {
          const message = extractErrorMessage(error);
          const localizedFailure = localizeModelLoadFailure(message, locale);
          if (shouldStopAutoModelRetry(message)) {
            stopAutoRetry = true;
            setModelLoadFailure(localizedFailure);
            setShowModelManager(true);
            setStatusLine(localizedFailure);
          } else {
            setStatusLine(localizedFailure);
          }
        }
      }

      if (isCancelled) {
        return;
      }

      const shouldContinue =
        !stopAutoRetry
        && modelLoadFailure == null
        && (
          shouldKeepWaitingForBundledModel(modelsRef.current)
          || (hasDownloadedModel(modelsRef.current) && !hasLoadedModel(modelsRef.current))
        );

      if (shouldContinue) {
        timerId = window.setTimeout(() => {
          void syncNativeModelState();
        }, 1500);
      }
    };

    const shouldStart =
      modelsRef.current.some(isPreparingModel)
      || (modelsRef.current.some((model) => model.isDownloaded) && !modelsRef.current.some((model) => model.isLoaded));

    if (shouldStart) {
      void syncNativeModelState();
    }

    return () => {
      isCancelled = true;
      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [bridge, isBootstrapping, locale, modelLoadFailure, modelPreparingMessage, modelRequiredMessage, t]);

  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) {
      return;
    }
    if (messages.length === 0 && !isStreaming) {
      chatArea.scrollTop = 0;
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.sender === 'ai' && !latestMessage.isStreaming) {
      window.requestAnimationFrame(() => {
        const aiMessages = chatArea.querySelectorAll<HTMLElement>('.message.ai');
        const latestAiMessage = aiMessages[aiMessages.length - 1];
        if (latestAiMessage) {
          chatArea.scrollTop = Math.max(0, latestAiMessage.offsetTop - chatArea.offsetTop - 8);
        }
      });
      return;
    }

    chatArea.scrollTop = chatArea.scrollHeight;
  }, [messages, isStreaming]);

  const activeModel = useMemo(
    () => models.find((model) => model.isLoaded) ?? null,
    [models],
  );
  const recommendedDownloadModel = useMemo(
    () => chooseRecommendedDownloadModel(models),
    [models],
  );
  const alternateDownloadModel = useMemo(
    () => chooseAlternateDownloadModel(models, recommendedDownloadModel?.id),
    [models, recommendedDownloadModel?.id],
  );
  const batteryWarning = batteryStatus ? resolveBatteryWarning(batteryStatus, t) : undefined;
  const showModelDownloadGuide =
    showModelManager
    && !isBootstrapping
    && modelLoadFailure == null
    && models.length > 0
    && !hasDownloadedModel(models);

  async function waitForBootstrap(): Promise<void> {
    if (!bootPromiseRef.current) {
      for (let attempt = 0; attempt < 50 && !bootPromiseRef.current; attempt += 1) {
        await sleep(10);
      }
    }

    if (bootPromiseRef.current) {
      await bootPromiseRef.current;
    }
  }

  async function reconcileModelState(nextModels: ModelDescriptor[], nextStatusLine?: string): Promise<ModelDescriptor[]> {
    modelsRef.current = nextModels;
    setModels(nextModels);

    const readyModel = choosePreferredReadyModel(nextModels);
    const hasLoadedReadyModel = hasLoadedModel(nextModels);
    if (readyModel && !hasLoadedReadyModel) {
      const loadedModels = await bridge.loadModel(readyModel.id);
      modelsRef.current = loadedModels;
      setModels(loadedModels);
      setModelLoadFailure(null);
      setStatusLine(nextStatusLine ?? t('status.model_switched'));
      return loadedModels;
    }

    if (nextStatusLine) {
      setStatusLine(nextStatusLine);
    }
    return nextModels;
  }

  async function recoverBundledModelIntoState(): Promise<ModelDescriptor[]> {
    setIsRecoveringModel(true);
    setStatusLine(modelPreparingMessage);
    try {
      const recoveredModels = await recoverBundledModelState(bridge, { retries: 3, retryDelayMs: 350 });
      if (recoveredModels.length > 0) {
        return await reconcileModelState(recoveredModels, t('status.model_switched'));
      }
      return recoveredModels;
    } finally {
      setIsRecoveringModel(false);
    }
  }

  async function ensureLocalModelReady(): Promise<boolean> {
    if (isBootstrapping) {
      await waitForBootstrap();
    }

    if (modelsRef.current.length === 0 || !modelsRef.current.some((model) => model.isDownloaded)) {
      await recoverBundledModelIntoState();
    }

    if (modelsRef.current.length > 0) {
      await reconcileModelState(modelsRef.current);
    }

    if (hasDownloadedModel(modelsRef.current) && hasLoadedModel(modelsRef.current)) {
      return true;
    }

    const systemMessage = (isRecoveringModel || shouldKeepWaitingForBundledModel(modelsRef.current))
      ? modelPreparingMessage
      : modelRequiredMessage;
    setShowModelManager(true);
    setStatusLine(systemMessage);
    setMessages((prev) => {
      if (prev.some((message) => message.sender === 'system' && message.text === systemMessage)) {
        return prev;
      }
      return [
        ...prev,
        { id: createId('system'), sender: 'system', text: systemMessage },
      ];
    });
    return false;
  }

  async function refreshBattery(nextMode?: PowerMode): Promise<void> {
    const status = nextMode
      ? await bridge.setPowerMode(nextMode)
      : await bridge.getBatteryStatus();
    setBatteryStatus(status);
    setPowerMode(status.forcedPowerMode);

    const localizedWarning = resolveBatteryWarning(status, t);
    if (localizedWarning) {
      setMessages((prev) => {
        if (prev.some((message) => message.text === localizedWarning)) {
          return prev;
        }
        return [
          ...prev,
          { id: createId('system'), sender: 'system', text: localizedWarning },
        ];
      });
    }
  }

  function handleClearChat() {
    setConfirmClearOpen(true);
  }

  function confirmClearChat() {
    haptics.medium();
    const hadActiveInference = isStreaming;
    invalidateInferenceRun();
    resetConversationUiState();
    setConfirmClearOpen(false);
    if (hadActiveInference) {
      void bridge.cancelActiveInference().catch(() => undefined);
    }
  }

  async function runTriage(
    request: Parameters<typeof attachTriageSession>[0],
  ): Promise<void> {
    const requestWithSession = attachTriageSession(request, triageSession);
    if (triageSession.resetContext) {
      setTriageSession((current) => consumeTriageSessionReset(current));
    }

    const inferenceRunId = beginInferenceRun();
    setIsStreaming(true);
    setStatusLine(t('status.inferring'));
    const streamingMessageId = `stream-${createId('ai')}`;

    const userMessage: BeaconMessage = {
      id: createId('user'),
      sender: 'user',
      text: requestWithSession.userText,
    };
    setMessages((prev) => [...prev, userMessage]);

    let streamedText = '';
    let finalResponse: TriageResponse | undefined;
    let lastStreamUiFlushAt = 0;
    let lastRenderedStreamText = '';

    const flushStreamingMessage = (force = false): void => {
      if (!isInferenceRunActive(inferenceRunId)) {
        return;
      }

      const formattedText = formatModelTextForDisplay(streamedText);
      if (!hasMeaningfulModelText(formattedText)) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastStreamUiFlushAt < STREAM_UI_FLUSH_INTERVAL_MS) {
        return;
      }

      if (!force && formattedText === lastRenderedStreamText) {
        return;
      }

      lastStreamUiFlushAt = now;
      lastRenderedStreamText = formattedText;

      const partialResponse: TriageResponse = finalResponse ?? {
        summary: formattedText,
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
        usedProfileName: activeModel?.name ?? 'Gemma 4 E2B',
      };

      setMessages((prev) => {
        const next = [...prev];
        const partialMessage = buildAiMessage(partialResponse, formattedText, {
          isStreaming: true,
        });
        const streamingIndex = next.findIndex((message) => message.id === streamingMessageId);
        if (streamingIndex >= 0) {
          next[streamingIndex] = { ...next[streamingIndex], ...partialMessage, id: streamingMessageId };
        } else {
          next.push({ ...partialMessage, id: streamingMessageId });
        }
        return next;
      });
    };

    try {
      for await (const chunk of bridge.triageStream(requestWithSession)) {
        if (!isInferenceRunActive(inferenceRunId)) {
          break;
        }

        if (chunk.delta) {
          streamedText += chunk.delta;
          flushStreamingMessage();
        }

        if (chunk.final) {
          finalResponse = chunk.final;
          flushStreamingMessage(true);
        }
      }

      if (!isInferenceRunActive(inferenceRunId)) {
        return;
      }

      if (finalResponse) {
        const settledResponse = finalResponse;
        const finalText = formatResponseText(settledResponse, streamedText);

        setMessages((prev) => {
          const next = [...prev];
          const finalMessage = buildAiMessage(settledResponse, finalText);
          const streamingIndex = next.findIndex((message) => message.id === streamingMessageId);
          if (streamingIndex >= 0) {
            next[streamingIndex] = { ...finalMessage, id: createId('ai') };
          } else {
            next.push(finalMessage);
          }
          return next;
        });

        setStatusLine(
          settledResponse.isKnowledgeBacked ? t('status.evidence_hit') : t('status.model_responded'),
        );
      }
    } catch (error) {
      if (!isInferenceRunActive(inferenceRunId)) {
        return;
      }
      const message = extractErrorMessage(error) || t('status.infer_failed');
      setMessages((prev) => [
        ...prev,
        { id: createId('system'), sender: 'system', text: t('error.generic', { message }) },
      ]);
      setStatusLine(t('status.infer_failed'));
    } finally {
      if (isInferenceRunActive(inferenceRunId)) {
        setIsStreaming(false);
        await refreshBattery();
      }
    }
  }

  async function handleQuickAction(
    categoryHint: string,
    userText: string,
  ): Promise<void> {
    haptics.light();
    if (!(await ensureLocalModelReady())) {
      return;
    }
    await runTriage({
      categoryHint,
      userText,
      powerMode,
      locale,
    });
  }

  async function handleSendChat(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    if (!chatInput.trim() || isStreaming) {
      return;
    }
    haptics.light();
    if (!(await ensureLocalModelReady())) {
      return;
    }

    const input = chatInput.trim();
    setChatInput('');
    await runTriage({
      userText: input,
      powerMode,
      locale,
    });
  }

  async function handleVisualAnalysis(): Promise<void> {
    haptics.light();
    if (!(await ensureLocalModelReady())) {
      return;
    }

    let inferenceRunId: number | null = null;
    try {
      const photo = await CapacitorCamera.getPhoto({
        source: CameraSource.Prompt,
        resultType: CameraResultType.Base64,
        quality: 72,
        width: 1536,
        height: 1536,
        allowEditing: false,
        saveToGallery: false,
        correctOrientation: true,
        promptLabelHeader: t('action.visual_help'),
        promptLabelPhoto: t('action.import_photo'),
        promptLabelPicture: t('camera.capture_aria'),
        promptLabelCancel: t('camera.cancel'),
      });
      const imageBase64 = photo.base64String?.trim();
      if (!imageBase64) {
        throw new Error(t('status.infer_failed'));
      }

      inferenceRunId = beginInferenceRun();
      setIsStreaming(true);
      setStatusLine(t('status.inferring'));
      setMessages((prev) => [
        ...prev,
        {
          id: createId('user'),
          sender: 'user',
          text: t('system.visual_request'),
        },
      ]);

      const request = attachTriageSession(
        {
          userText: '',
          categoryHint: CANONICAL_ROUTE_HINTS.VISUAL_HELP,
          powerMode,
          imageBase64,
          locale,
        },
        triageSession,
      );
      if (triageSession.resetContext) {
        setTriageSession((current) => consumeTriageSessionReset(current));
      }

      const response = await bridge.analyzeVisual(request);
      if (!isInferenceRunActive(inferenceRunId)) {
        return;
      }

      const text = formatResponseText(response);
      setMessages((prev) => [...prev, buildAiMessage(response, text)]);
      setStatusLine(response.isKnowledgeBacked ? t('status.visual_evidence') : t('status.visual_done'));
    } catch (error) {
      if (isCancelledCameraCapture(error)) {
        return;
      }
      if (inferenceRunId !== null && !isInferenceRunActive(inferenceRunId)) {
        return;
      }
      const message = extractErrorMessage(error) || t('status.infer_failed');
      setMessages((prev) => [
        ...prev,
        { id: createId('system'), sender: 'system', text: t('error.generic', { message }) },
      ]);
      setStatusLine(t('status.infer_failed'));
    } finally {
      if (inferenceRunId !== null && isInferenceRunActive(inferenceRunId)) {
        setIsStreaming(false);
        await refreshBattery();
      }
    }
  }

  async function handleSwitchPowerMode(mode: PowerMode): Promise<void> {
    await refreshBattery(mode);
    setStatusLine(mode === 'doomsday' ? t('status.doomsday_on') : t('status.standard_power'));
  }

  async function handleDownloadModel(modelId: string): Promise<void> {
    const targetModel = modelsRef.current.find((model) => model.id === modelId);
    if (targetModel && isPreparingModel(targetModel)) {
      setStatusLine(modelPreparingMessage);
      return;
    }

    try {
      setModelLoadFailure(null);

      if (!targetModel?.isDownloaded) {
        setStatusLine(t('status.downloading', { modelId }));
        for await (const chunk of bridge.downloadModel(modelId)) {
          setDownloadProgress((prev) => ({ ...prev, [modelId]: chunk.fraction }));
        }
        setStatusLine(t('status.download_done', { modelId }));
      }

      const nextModels = await bridge.loadModel(modelId);
      modelsRef.current = nextModels;
      setModels(nextModels);
      setDownloadProgress((prev) => ({ ...prev, [modelId]: 1 }));
      setStatusLine(t('status.model_switched'));
      closeModelManager();
    } catch (error) {
      const message = extractErrorMessage(error);
      const localizedFailure = localizeModelLoadFailure(message, locale);
      setModelLoadFailure(localizedFailure);
      setStatusLine(localizedFailure);
      setShowModelManager(true);
    }
  }

  async function handleToggleModelManager(): Promise<void> {
    if (showModelManager) {
      closeModelManager();
      return;
    }

    if (isBootstrapping) {
      await waitForBootstrap();
    }

    if (modelsRef.current.length === 0 || !modelsRef.current.some((model) => model.isDownloaded)) {
      await recoverBundledModelIntoState();
    } else if (modelsRef.current.some((model) => model.isDownloaded) && !modelsRef.current.some((model) => model.isLoaded)) {
      await reconcileModelState(modelsRef.current);
    }

    setShowModelManager(true);
  }

  useEffect(() => {
    if (!isNativeAndroidApp()) {
      return undefined;
    }

    let isDisposed = false;
    let listenerHandle: { remove: () => Promise<void> } | undefined;

    void CapacitorApp.addListener('backButton', () => {
      if (showModelManager) {
        closeModelManager();
        return;
      }

      if (hasMessages || chatInput.trim().length > 0) {
        handleClearChat();
        return;
      }

      void CapacitorApp.exitApp();
    }).then((handle) => {
      if (isDisposed) {
        void handle.remove();
        return;
      }

      listenerHandle = handle;
    });

    return () => {
      isDisposed = true;
      if (listenerHandle) {
        void listenerHandle.remove();
      }
    };
  }, [chatInput, hasMessages, showModelManager]);

  const visibleStatusLine =
    statusLine === t('status.offline_ready') && !isStreaming && !isBootstrapping
      ? undefined
      : statusLine;

  return (
    <div className="container">
      <NavBar
        showBack={hasMessages}
        onBack={hasMessages ? handleClearChat : undefined}
        statusLine={visibleStatusLine}
      />

      {batteryWarning && (
        <div className="warning-banner">
          <Zap size={16} />
          <span>{batteryWarning}</span>
        </div>
      )}

      <div className="chat-area" ref={chatAreaRef} role="log" tabIndex={-1}>
        {!hasMessages ? (
          <div className="empty-state">
            <HeroPanel />
            <RouteGrid
              routeActions={routeActions}
              onQuickAction={(categoryHint, userText) => void handleQuickAction(categoryHint, userText)}
              onVisualAnalysis={() => void handleVisualAnalysis()}
            />
          </div>
        ) : (
          <ChatMessages messages={messages} />
        )}

        {isStreaming && (
          <div className="streaming-indicator">
            <LoaderCircle size={16} className="spin" />
            {t('chat.streaming')}
          </div>
        )}
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isStreaming ? t('chat.streaming') : ''}
      </div>

      <ChatInputBar
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSubmit={(event) => void handleSendChat(event)}
        onVisualAnalysis={() => void handleVisualAnalysis()}
        onToggleModelManager={() => void handleToggleModelManager()}
        isStreaming={isStreaming}
      />

      <ModelPanel
        show={showModelManager}
        onClose={closeModelManager}
        models={models}
        batteryStatus={batteryStatus}
        powerMode={powerMode}
        downloadProgress={downloadProgress}
        modelLoadFailure={modelLoadFailure}
        isBootstrapping={isBootstrapping}
        isRecoveringModel={isRecoveringModel}
        recommendedDownloadModel={recommendedDownloadModel}
        alternateDownloadModel={alternateDownloadModel}
        showModelDownloadGuide={showModelDownloadGuide}
        onSwitchPowerMode={(mode) => void handleSwitchPowerMode(mode)}
        onDownloadModel={(modelId) => void handleDownloadModel(modelId)}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title={t('confirm.clear_title')}
        message={t('confirm.clear_message')}
        confirmLabel={t('confirm.clear_yes')}
        cancelLabel={t('confirm.clear_no')}
        onConfirm={confirmClearChat}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
}
