import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Camera as CameraIcon,
  Download,
  LoaderCircle,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { NavBar } from './components/NavBar';
import { MarkdownMessage } from './components/MarkdownMessage';
import { useI18n } from './i18n';
import { resolveLocaleCode, translateMessage } from './i18n/translate';
import type { BeaconBridge } from './lib/beaconBridge';
import { brandTitleForLocale } from './lib/brand';
import {
  buildDisplayResponseText,
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
import type {
  BatteryStatus,
  BeaconMessage,
  ModelDescriptor,
  PowerMode,
  TriageResponse,
} from './lib/types';

function resolveBatteryWarning(
  status: BatteryStatus,
  localize: (key: Parameters<ReturnType<typeof useI18n>['t']>[0], params?: Record<string, string | number>) => string,
): string | undefined {
  if (status.warningCode === 'battery.low_power_emergency') {
    return localize('warning.battery_low');
  }

  return status.warning;
}

function formatModelSizeLabel(
  model: ModelDescriptor,
  localize: ReturnType<typeof useI18n>['t'],
): string {
  if (model.id === 'gemma-4-e2b' || model.tier === 'e2b') {
    return localize('model.size_e2b');
  }
  if (model.id === 'gemma-4-e4b' || model.tier === 'e4b') {
    return localize('model.size_e4b');
  }
  return model.sizeLabel;
}

function chooseRecommendedDownloadModel(models: ModelDescriptor[]): ModelDescriptor | null {
  return models.find((model) => model.id === 'gemma-4-e2b')
    ?? models[0]
    ?? null;
}

function chooseAlternateDownloadModel(
  models: ModelDescriptor[],
  recommendedModelId?: string,
): ModelDescriptor | null {
  return models.find((model) => model.id === 'gemma-4-e4b' && model.id !== recommendedModelId)
    ?? models.find((model) => model.id !== recommendedModelId)
    ?? null;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }
  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? error.message : undefined;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage.trim();
    }
  }
  return '';
}

function isCancelledCameraCapture(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('cancel');
}

function shouldStopAutoModelRetry(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('below the current gemma 4 e2b ios baseline')
    || normalized.includes('内存低于 6gb')
    || normalized.includes('litert-lm failed to initialize gemma 4 on this ios runtime');
}

const MODEL_LOW_MEMORY_MESSAGE: Record<string, string> = {
  en: 'This iPhone has under 6 GB RAM, so Gemma 4 E2B cannot start locally on this device. Use a newer iPhone or Android flagship.',
  'zh-CN': '当前这台 iPhone 内存低于 6GB，无法在本机启动 Gemma 4 E2B。请改用更新的 iPhone 或 Android 旗舰机。',
  'zh-TW': '目前這台 iPhone 記憶體低於 6GB，無法在本機啟動 Gemma 4 E2B。請改用更新的 iPhone 或 Android 旗艦機。',
  ja: 'この iPhone は 6GB 未満のメモリのため、Gemma 4 E2B を端末上で起動できません。より新しい iPhone か Android 端末を使用してください。',
  ko: '이 iPhone은 메모리가 6GB 미만이라 Gemma 4 E2B를 기기에서 실행할 수 없습니다. 더 최신 iPhone 또는 Android 기기를 사용하세요.',
  es: 'Este iPhone tiene menos de 6 GB de RAM, por lo que Gemma 4 E2B no puede iniciarse localmente. Usa un iPhone mas nuevo o un Android de gama alta.',
  fr: 'Cet iPhone a moins de 6 Go de RAM, donc Gemma 4 E2B ne peut pas demarrer localement. Utilise un iPhone plus recent ou un Android haut de gamme.',
  de: 'Dieses iPhone hat weniger als 6 GB RAM, deshalb kann Gemma 4 E2B nicht lokal gestartet werden. Nutze ein neueres iPhone oder ein Android-Flaggschiff.',
  pt: 'Este iPhone tem menos de 6 GB de RAM, entao o Gemma 4 E2B nao pode iniciar localmente. Use um iPhone mais novo ou um Android topo de linha.',
  ru: 'На этом iPhone меньше 6 ГБ ОЗУ, поэтому Gemma 4 E2B не может запуститься локально. Используй более новый iPhone или флагманский Android.',
  ar: 'يحتوي هذا iPhone على أقل من 6 جيجابايت من الذاكرة، لذلك لا يمكن تشغيل Gemma 4 E2B محليًا. استخدم iPhone أحدث أو هاتف Android رائد.',
  hi: 'इस iPhone में 6 GB से कम RAM है, इसलिए Gemma 4 E2B लोकल रूप से शुरू नहीं हो सकता। नया iPhone या फ्लैगशिप Android इस्तेमाल करें।',
  id: 'iPhone ini memiliki RAM kurang dari 6 GB, jadi Gemma 4 E2B tidak bisa berjalan secara lokal. Gunakan iPhone yang lebih baru atau Android flagship.',
  it: 'Questo iPhone ha meno di 6 GB di RAM, quindi Gemma 4 E2B non puo avviarsi in locale. Usa un iPhone piu recente o un Android di fascia alta.',
  tr: 'Bu iPhone 6 GB altinda belleğe sahip, bu nedenle Gemma 4 E2B cihazda yerel olarak baslayamaz. Daha yeni bir iPhone veya ust duzey bir Android kullan.',
  vi: 'iPhone nay co duoi 6 GB RAM, vi vay Gemma 4 E2B khong the chay cuc bo. Hay dung iPhone moi hon hoac Android cao cap.',
  th: 'iPhone เครื่องนี้มี RAM น้อยกว่า 6 GB จึงไม่สามารถเริ่ม Gemma 4 E2B บนเครื่องได้ ใช้ iPhone ที่ใหม่กว่าหรือ Android ระดับเรือธงแทน',
  nl: 'Deze iPhone heeft minder dan 6 GB RAM, waardoor Gemma 4 E2B niet lokaal kan starten. Gebruik een nieuwere iPhone of een Android-vlaggenschip.',
  pl: 'Ten iPhone ma mniej niz 6 GB RAM, dlatego Gemma 4 E2B nie uruchomi sie lokalnie. Uzyj nowszego iPhone a albo flagowego Androida.',
  uk: 'Цей iPhone має менше ніж 6 ГБ пам яті, тому Gemma 4 E2B не може запуститися локально. Використай новіший iPhone або флагманський Android.',
};

const MODEL_RUNTIME_INIT_MESSAGE: Record<string, string> = {
  en: 'LiteRT-LM could not start Gemma 4 E2B on this iPhone runtime. Automatic retries have been paused; retry manually after changing device or runtime conditions.',
  'zh-CN': '这台 iPhone 上的 LiteRT-LM 运行时未能启动 Gemma 4 E2B，本次已停止自动重试。请手动重试，或更换受支持设备继续验证。',
  'zh-TW': '這台 iPhone 上的 LiteRT-LM 執行時未能啟動 Gemma 4 E2B，本次已停止自動重試。請手動重試，或更換受支援裝置繼續驗證。',
  ja: 'この iPhone の LiteRT-LM ランタイムでは Gemma 4 E2B を起動できませんでした。自動再試行は停止したため、端末や実行条件を変えて手動で再試行してください。',
  ko: '이 iPhone 런타임에서는 LiteRT-LM이 Gemma 4 E2B를 시작하지 못했습니다. 자동 재시도는 중지되었으니 기기나 실행 조건을 바꾼 뒤 수동으로 다시 시도하세요.',
  es: 'LiteRT-LM no pudo iniciar Gemma 4 E2B en este runtime de iPhone. Los reintentos automaticos se pausaron; vuelve a intentarlo manualmente tras cambiar el dispositivo o las condiciones.',
  fr: 'LiteRT-LM n a pas pu lancer Gemma 4 E2B sur cet iPhone. Les nouvelles tentatives automatiques sont en pause ; reessaie manuellement apres avoir change l appareil ou les conditions.',
  de: 'LiteRT-LM konnte Gemma 4 E2B auf diesem iPhone nicht starten. Automatische Wiederholungen wurden pausiert; versuche es nach einem Geraete- oder Laufzeitwechsel manuell erneut.',
  pt: 'O LiteRT-LM nao conseguiu iniciar o Gemma 4 E2B neste iPhone. As novas tentativas automaticas foram pausadas; tente manualmente apos mudar o aparelho ou as condicoes.',
  ru: 'LiteRT-LM не смог запустить Gemma 4 E2B на этом iPhone. Автоповторы остановлены; повтори попытку вручную после смены устройства или условий выполнения.',
  ar: 'تعذر على LiteRT-LM تشغيل Gemma 4 E2B على هذا الـ iPhone. تم إيقاف إعادة المحاولة التلقائية؛ أعد المحاولة يدويًا بعد تغيير الجهاز أو ظروف التشغيل.',
  hi: 'LiteRT-LM इस iPhone पर Gemma 4 E2B शुरू नहीं कर पाया। ऑटो रीट्राई रोक दिए गए हैं; डिवाइस या रनटाइम स्थिति बदलकर मैन्युअली फिर कोशिश करें।',
  id: 'LiteRT-LM tidak bisa memulai Gemma 4 E2B di iPhone ini. Percobaan ulang otomatis dihentikan; coba lagi secara manual setelah mengganti perangkat atau kondisi runtime.',
  it: 'LiteRT-LM non e riuscito ad avviare Gemma 4 E2B su questo iPhone. I tentativi automatici sono stati sospesi; riprova manualmente dopo aver cambiato dispositivo o condizioni di runtime.',
  tr: 'LiteRT-LM bu iPhone uzerinde Gemma 4 E2B yi baslatamadi. Otomatik yeniden denemeler durduruldu; cihazi veya calisma kosullarini degistirdikten sonra elle tekrar dene.',
  vi: 'LiteRT-LM khong the khoi dong Gemma 4 E2B tren iPhone nay. Viec thu lai tu dong da tam dung; hay thu cong sau khi doi thiet bi hoac dieu kien runtime.',
  th: 'LiteRT-LM ไม่สามารถเริ่ม Gemma 4 E2B บน iPhone เครื่องนี้ได้ จึงหยุดการลองใหม่อัตโนมัติไว้ก่อน โปรดลองใหม่ด้วยตนเองหลังเปลี่ยนอุปกรณ์หรือสภาพแวดล้อมการทำงาน',
  nl: 'LiteRT-LM kon Gemma 4 E2B niet starten op deze iPhone-runtime. Automatische nieuwe pogingen zijn gepauzeerd; probeer handmatig opnieuw na het wijzigen van apparaat of runtime-omstandigheden.',
  pl: 'LiteRT-LM nie mogl uruchomic Gemma 4 E2B na tym iPhonie. Automatyczne ponowne proby zostaly wstrzymane; sprobuj recznie po zmianie urzadzenia lub warunkow uruchomienia.',
  uk: 'LiteRT-LM не зміг запустити Gemma 4 E2B на цьому iPhone. Автоматичні повторні спроби призупинено; спробуй ще раз вручну після зміни пристрою або умов виконання.',
};

function localizeModelLoadFailure(message: string, locale: string): string {
  const resolvedLocale = resolveLocaleCode(locale);
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes('below the current gemma 4 e2b ios baseline')
    || normalizedMessage.includes('内存低于 6gb')
  ) {
    return MODEL_LOW_MEMORY_MESSAGE[resolvedLocale] ?? MODEL_LOW_MEMORY_MESSAGE.en;
  }

  if (normalizedMessage.includes('litert-lm failed to initialize gemma 4 on this ios runtime')) {
    return MODEL_RUNTIME_INIT_MESSAGE[resolvedLocale] ?? MODEL_RUNTIME_INIT_MESSAGE.en;
  }

  return message || translateMessage(resolvedLocale, 'status.infer_failed');
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isNativeAndroidApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function buildAiMessage(
  response: TriageResponse,
  text: string,
  options?: { isStreaming?: boolean },
): BeaconMessage {
  return {
    id: createId('ai'),
    sender: 'ai',
    text: formatModelTextForDisplay(text),
    isStreaming: options?.isStreaming ?? false,
    isAuthoritative: response.isKnowledgeBacked,
    guidanceMode: response.guidanceMode,
    evidence: response.evidence,
    disclaimer: response.disclaimer,
  };
}

function formatResponseText(response: TriageResponse, streamedText?: string): string {
  return buildDisplayResponseText(response, streamedText);
}

function isPreparingModel(model: ModelDescriptor): boolean {
  return !model.isDownloaded
    && (model.downloadStatus === 'in_progress' || model.downloadStatus === 'partially_downloaded');
}

function choosePreferredReadyModel(models: ModelDescriptor[]): ModelDescriptor | null {
  return models.find((model) => model.isDownloaded && model.id === 'gemma-4-e2b')
    ?? models.find((model) => model.isDownloaded)
    ?? null;
}

function hasDownloadedModel(models: ModelDescriptor[]): boolean {
  return models.some((model) => model.isDownloaded);
}

function hasLoadedModel(models: ModelDescriptor[]): boolean {
  return models.some((model) => model.isLoaded);
}

function isBundledModelPlaceholder(model: ModelDescriptor): boolean {
  return model.id === DEFAULT_BUNDLED_MODEL_ID && !model.isDownloaded;
}

function shouldKeepWaitingForBundledModel(models: ModelDescriptor[]): boolean {
  return models.length === 0
    || models.some(isPreparingModel)
    || models.every(isBundledModelPlaceholder);
}

function needsBundledModelRecovery(models: ModelDescriptor[]): boolean {
  return models.length === 0
    || !hasDownloadedModel(models)
    || models.every(isBundledModelPlaceholder);
}

const DEFAULT_BUNDLED_MODEL_ID = 'gemma-4-e2b';
const STREAM_UI_FLUSH_INTERVAL_MS = 80;

async function recoverBundledModelState(
  bridge: BeaconBridge,
  options?: { retries?: number; retryDelayMs?: number },
): Promise<ModelDescriptor[]> {
  const retries = options?.retries ?? 2;
  const retryDelayMs = options?.retryDelayMs ?? 300;
  let latestModels: ModelDescriptor[] = [];

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const loadedModels = await bridge.loadModel(DEFAULT_BUNDLED_MODEL_ID);
      if (loadedModels.length > 0) {
        latestModels = loadedModels;
      }
    } catch {
      // If the direct load races with native startup, fall through to another list refresh.
    }

    if (hasDownloadedModel(latestModels)) {
      return latestModels;
    }

    try {
      const listedModels = await bridge.listModels();
      if (listedModels.length > 0 || latestModels.length === 0) {
        latestModels = listedModels;
      }
    } catch {
      // Keep the latest successful snapshot and retry below.
    }

    if (hasDownloadedModel(latestModels) || attempt === retries) {
      return latestModels;
    }

    await sleep(retryDelayMs * (attempt + 1));
  }

  return latestModels;
}

export default function App() {
  const { t, locale } = useI18n();
  const bridge = useMemo(() => getBeaconBridge(), []);

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

  function formatBattery(status: BatteryStatus | null): string {
    if (!status) {
      return t('battery.unknown');
    }
    return t('battery.level', { level: (status.level * 100).toFixed(0) });
  }

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
    if (!chatAreaRef.current) {
      return;
    }
    chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
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
    const hadActiveInference = isStreaming;
    invalidateInferenceRun();
    resetConversationUiState();
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

  return (
    <div className="container">
      <NavBar
        showBack={hasMessages}
        onBack={hasMessages ? handleClearChat : undefined}
        statusLine={statusLine}
      />

      {batteryWarning && (
        <div className="warning-banner">
          <Zap size={16} />
          <span>{batteryWarning}</span>
        </div>
      )}

      <div className="chat-area" ref={chatAreaRef}>
        {!hasMessages ? (
          <div className="empty-state">
            <section className="hero-panel">
              <p className="hero-kicker">{t('hero.kicker')}</p>
              <h1>{t('hero.title')}</h1>
              <p className="hero-subtitle">{t('hero.subtitle')}</p>
            </section>

            <section className="briefing-card">
              <p className="briefing-chip">{t('hero.input_rule')}</p>
              <p className="briefing-note">{t('hero.default_rule')}</p>
              <div className="example-block">
                <span className="example-label">{t('hero.example_title')}</span>
                <p>{t('hero.example_query')}</p>
              </div>
            </section>

            <div className="route-grid">
              {routeActions.map((action) => (
                <button
                  key={action.label}
                  className="route-card"
                  onClick={() => void handleQuickAction(action.categoryHint, action.userText)}
                  type="button"
                >
                  <span className="route-icon-shell" aria-hidden="true">
                    <span className="icon">{action.icon}</span>
                  </span>
                  <span className="route-copy">
                    <span className="route-label">{action.label}</span>
                    <span className="route-description">{action.description}</span>
                  </span>
                </button>
              ))}
            </div>

            <button className="viewfinder-btn" onClick={() => void handleVisualAnalysis()} type="button">
              <span className="viewfinder-icon-shell" aria-hidden="true">
                <CameraIcon size={21} strokeWidth={2.25} />
              </span>
              <span className="viewfinder-copy">
                <span className="viewfinder-label">{t('action.visual_help')}</span>
                <span className="viewfinder-note">{t('camera.prompt2')}</span>
              </span>
            </button>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <article key={message.id} className={`message ${message.sender}`}>
                {message.isAuthoritative && !message.isStreaming && (
                  <div className="authoritative-badge">
                    <ShieldCheck size={14} />
                    {t('badge.authoritative')}
                  </div>
                )}
                {message.sender === 'ai' ? (
                  <MarkdownMessage text={message.text} />
                ) : (
                  <div className="message-text">{message.text}</div>
                )}
                {message.evidence && !message.isStreaming && message.evidence.authoritative.length > 0 && (
                  <div className="evidence-panel">
                    <div className="evidence-row">
                      <span className="evidence-label">{t('evidence.source')}</span>
                      <div className="evidence-chips">
                        {message.evidence.authoritative.map((item) => (
                          <span key={item.id} className="evidence-chip authority">
                            {item.source}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {message.disclaimer && !message.isStreaming && (
                  <div className="message-disclaimer">{message.disclaimer}</div>
                )}
              </article>
            ))}
          </>
        )}

        {isStreaming && (
          <div className="streaming-indicator">
            <LoaderCircle size={16} className="spin" />
            {t('chat.streaming')}
          </div>
        )}
      </div>

      <div className="fixed-bottom-panel">
        <form className="chat-input-wrapper" onSubmit={(event) => void handleSendChat(event)}>
          <input
            type="text"
            className="chat-input"
            placeholder={t('chat.input_placeholder')}
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            disabled={isStreaming}
          />
          <button className="send-btn" type="submit" disabled={isStreaming}>
            {t('chat.send')}
          </button>
        </form>

        <div className="bottom-toolbar">
          <button className="tool-btn" onClick={() => void handleVisualAnalysis()} type="button">
            <CameraIcon size={18} />
            <span>{t('action.visual_help')}</span>
          </button>
          <button
            className="model-mgr-btn"
            onClick={() => void handleToggleModelManager()}
            aria-label={t('model.manage')}
            title={t('model.manage')}
            type="button"
          >
            <Settings size={18} />
            <span>{t('model.manage')}</span>
          </button>
        </div>
      </div>

      {showModelManager && (
        <div
          className="sheet-backdrop"
          onClick={closeModelManager}
          aria-hidden="true"
        />
      )}

      {showModelManager && (
        <section className="model-panel">
          <div className="model-panel-header">
            <h2>{t('model.manage')}</h2>
            <button onClick={closeModelManager} type="button">{t('model.close')}</button>
          </div>

          <div className="power-strip">
            <div>
              <div className="power-strip-value">{formatBattery(batteryStatus)}</div>
              <div className="power-strip-label">
                {powerMode === 'doomsday' ? t('power.doomsday.active') : t('power.normal.active')}
              </div>
            </div>
            <button
              className={`power-toggle ${powerMode === 'doomsday' ? 'active' : ''}`}
              onClick={() => void handleSwitchPowerMode(powerMode === 'normal' ? 'doomsday' : 'normal')}
              type="button"
            >
              {powerMode === 'doomsday' ? t('power.normal.toggle') : t('power.doomsday.toggle')}
            </button>
          </div>

          <div className="model-list">
            {modelLoadFailure && (
              <p className="model-error-note">{modelLoadFailure}</p>
            )}

            {showModelDownloadGuide && (
              <section className="model-onboarding-card" aria-label={t('status.model_required')}>
                <div className="model-onboarding-copy">
                  <span className="model-onboarding-kicker">Gemma 4</span>
                  <h3>{t('model.manage')}</h3>
                  <p>{t('status.model_required')}</p>
                </div>

                <div className="model-onboarding-actions">
                  {[recommendedDownloadModel, alternateDownloadModel]
                    .filter((model): model is ModelDescriptor => model != null)
                    .map((model, index) => {
                      const progress = downloadProgress[model.id];
                      const isBusy = isPreparingModel(model) || (progress != null && progress < 1);
                      const actionLabel = model.isDownloaded ? t('model.switch_btn') : t('model.download_btn');

                      return (
                        <button
                          key={model.id}
                          type="button"
                          className={`model-onboarding-action ${index === 0 ? 'primary' : 'secondary'}`}
                          onClick={() => void handleDownloadModel(model.id)}
                          disabled={isBusy}
                          aria-busy={isBusy}
                          aria-label={`${actionLabel} ${model.name}`}
                        >
                          <div className="model-onboarding-action-row">
                            <span className="model-onboarding-action-title">{model.name}</span>
                            <Download size={15} />
                          </div>
                          <span className="model-onboarding-action-meta">
                            {formatModelSizeLabel(model, t)}
                          </span>
                          {isBusy && (
                            <span className="model-onboarding-action-progress">
                              {t('model.downloading', {
                                progress: ((progress ?? 0) * 100).toFixed(0),
                              })}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </section>
            )}

            {models.length === 0 ? (
              <p className="model-empty">
                {isBootstrapping || isRecoveringModel || modelLoadFailure == null
                  ? t('model.preparing')
                  : t('model.not_loaded')}
              </p>
            ) : (
              models.map((model) => (
                <div key={model.id} className={`model-card ${model.isLoaded ? 'loaded' : ''}`}>
                  <div className="model-card-copy">
                    <div className="model-card-heading">
                      <strong>{model.name}</strong>
                      <span className={`model-tier-badge tier-${model.tier}`}>
                        {formatModelSizeLabel(model, t)}
                      </span>
                    </div>
                    <p>
                      {model.isLoaded
                        ? t('model.loaded_tag')
                        : model.isDownloaded
                          ? t('model.switch_btn')
                          : t('model.download_btn')}
                    </p>
                  </div>

                  <div className="model-actions">
                    {downloadProgress[model.id] != null && downloadProgress[model.id] < 1 && (
                      <div className="download-progress">
                        {t('model.downloading', { progress: (downloadProgress[model.id] * 100).toFixed(0) })}
                      </div>
                    )}
                    {model.isLoaded ? (
                      <span className="loaded-tag">{t('model.loaded_tag')}</span>
                    ) : isPreparingModel(model) ? (
                      <span className="loaded-tag">{t('model.preparing')}</span>
                    ) : (
                      <button onClick={() => void handleDownloadModel(model.id)} type="button">
                        <Download size={14} />
                        {model.isDownloaded ? t('model.switch_btn') : t('model.download_btn')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
