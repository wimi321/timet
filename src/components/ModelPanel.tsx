import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Download } from 'lucide-react';
import { useI18n } from '../i18n';
import {
  formatModelSizeLabel,
  formatBatteryLabel,
  isPreparingModel,
} from '../lib/appHelpers';
import type {
  BatteryStatus,
  ModelDescriptor,
  PowerMode,
} from '../lib/types';

interface ModelPanelProps {
  show: boolean;
  onClose: () => void;
  models: ModelDescriptor[];
  batteryStatus: BatteryStatus | null;
  powerMode: PowerMode;
  downloadProgress: Record<string, number>;
  modelLoadFailure: string | null;
  isBootstrapping: boolean;
  isRecoveringModel: boolean;
  recommendedDownloadModel: ModelDescriptor | null;
  alternateDownloadModel: ModelDescriptor | null;
  showModelDownloadGuide: boolean;
  onSwitchPowerMode: (mode: PowerMode) => void;
  onDownloadModel: (modelId: string) => void;
}

export function ModelPanel({
  show,
  onClose,
  models,
  batteryStatus,
  powerMode,
  downloadProgress,
  modelLoadFailure,
  isBootstrapping,
  isRecoveringModel,
  recommendedDownloadModel,
  alternateDownloadModel,
  showModelDownloadGuide,
  onSwitchPowerMode,
  onDownloadModel,
}: ModelPanelProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!show || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [show]);

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="sheet-backdrop"
        onClick={onClose}
      />

      <section
        className="model-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="model-panel-title"
        onKeyDown={handleKeyDown}
      >
        <div className="model-panel-header">
          <h2 id="model-panel-title">{t('model.manage')}</h2>
          <button onClick={onClose} type="button">{t('model.close')}</button>
        </div>

        <div className="power-strip">
          <div>
            <div className="power-strip-value">{formatBatteryLabel(batteryStatus, t)}</div>
            <div className="power-strip-label">
              {powerMode === 'doomsday' ? t('power.doomsday.active') : t('power.normal.active')}
            </div>
          </div>
          <button
            className={`power-toggle ${powerMode === 'doomsday' ? 'active' : ''}`}
            onClick={() => onSwitchPowerMode(powerMode === 'normal' ? 'doomsday' : 'normal')}
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
                        onClick={() => onDownloadModel(model.id)}
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
                      <div className="download-bar-track">
                        <div
                          className="download-bar-fill"
                          style={{ width: `${(downloadProgress[model.id] ?? 0) * 100}%` }}
                        />
                      </div>
                      {t('model.downloading', { progress: (downloadProgress[model.id] * 100).toFixed(0) })}
                    </div>
                  )}
                  {model.isLoaded ? (
                    <span className="loaded-tag">{t('model.loaded_tag')}</span>
                  ) : isPreparingModel(model) ? (
                    <span className="loaded-tag">{t('model.preparing')}</span>
                  ) : (
                    <button onClick={() => onDownloadModel(model.id)} type="button">
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
    </>
  );
}
