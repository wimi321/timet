import { Capacitor } from '@capacitor/core';
import type { BeaconBridge } from './beaconBridge';
import {
  buildDisplayResponseText,
  formatModelTextForDisplay,
} from './modelText';
import { resolveLocaleCode, translateMessage } from '../i18n/translate';
import type {
  BatteryStatus,
  BeaconMessage,
  ModelDescriptor,
  TriageResponse,
} from './types';
import type { useI18n } from '../i18n';

export const DEFAULT_BUNDLED_MODEL_ID = 'gemma-4-e2b';
export const STREAM_UI_FLUSH_INTERVAL_MS = 80;

export const MODEL_LOW_MEMORY_MESSAGE: Record<string, string> = {
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

export const MODEL_RUNTIME_INIT_MESSAGE: Record<string, string> = {
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

export function resolveBatteryWarning(
  status: BatteryStatus,
  localize: (key: Parameters<ReturnType<typeof useI18n>['t']>[0], params?: Record<string, string | number>) => string,
): string | undefined {
  if (status.warningCode === 'battery.low_power_emergency') {
    return localize('warning.battery_low');
  }
  return status.warning;
}

export function formatModelSizeLabel(
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

export function chooseRecommendedDownloadModel(models: ModelDescriptor[]): ModelDescriptor | null {
  return models.find((model) => model.id === 'gemma-4-e2b')
    ?? models[0]
    ?? null;
}

export function chooseAlternateDownloadModel(
  models: ModelDescriptor[],
  recommendedModelId?: string,
): ModelDescriptor | null {
  return models.find((model) => model.id === 'gemma-4-e4b' && model.id !== recommendedModelId)
    ?? models.find((model) => model.id !== recommendedModelId)
    ?? null;
}

export function extractErrorMessage(error: unknown): string {
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

export function isCancelledCameraCapture(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes('cancel');
}

export function shouldStopAutoModelRetry(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('below the current gemma 4 e2b ios baseline')
    || normalized.includes('内存低于 6gb')
    || normalized.includes('litert-lm failed to initialize gemma 4 on this ios runtime');
}

export function localizeModelLoadFailure(message: string, locale: string): string {
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

export function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function isNativeAndroidApp(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export function buildAiMessage(
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

export function formatResponseText(response: TriageResponse, streamedText?: string): string {
  return buildDisplayResponseText(response, streamedText);
}

export function isPreparingModel(model: ModelDescriptor): boolean {
  return !model.isDownloaded
    && (model.downloadStatus === 'in_progress' || model.downloadStatus === 'partially_downloaded');
}

export function choosePreferredReadyModel(models: ModelDescriptor[]): ModelDescriptor | null {
  return models.find((model) => model.isDownloaded && model.id === 'gemma-4-e2b')
    ?? models.find((model) => model.isDownloaded)
    ?? null;
}

export function hasDownloadedModel(models: ModelDescriptor[]): boolean {
  return models.some((model) => model.isDownloaded);
}

export function hasLoadedModel(models: ModelDescriptor[]): boolean {
  return models.some((model) => model.isLoaded);
}

export function isBundledModelPlaceholder(model: ModelDescriptor): boolean {
  return model.id === DEFAULT_BUNDLED_MODEL_ID && !model.isDownloaded;
}

export function shouldKeepWaitingForBundledModel(models: ModelDescriptor[]): boolean {
  return models.length === 0
    || models.some(isPreparingModel)
    || models.every(isBundledModelPlaceholder);
}

export function needsBundledModelRecovery(models: ModelDescriptor[]): boolean {
  return models.length === 0
    || !hasDownloadedModel(models)
    || models.every(isBundledModelPlaceholder);
}

export async function recoverBundledModelState(
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

export function formatBatteryLabel(
  status: BatteryStatus | null,
  t: ReturnType<typeof useI18n>['t'],
): string {
  if (!status) {
    return t('battery.unknown');
  }
  return t('battery.level', { level: (status.level * 100).toFixed(0) });
}
