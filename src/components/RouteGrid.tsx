import { CameraIcon } from 'lucide-react';
import { useI18n } from '../i18n';

interface RouteAction {
  label: string;
  description: string;
  icon: string;
  categoryHint: string;
  userText: string;
}

interface RouteGridProps {
  routeActions: RouteAction[];
  onQuickAction: (categoryHint: string, userText: string) => void;
  onVisualAnalysis: () => void;
}

export function RouteGrid({ routeActions, onQuickAction, onVisualAnalysis }: RouteGridProps) {
  const { t } = useI18n();

  return (
    <>
      <div className="route-grid">
        {routeActions.map((action, index) => (
          <button
            key={action.label}
            className="route-card"
            style={{ animationDelay: `${120 + index * 80}ms` }}
            onClick={() => onQuickAction(action.categoryHint, action.userText)}
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

      <button className="viewfinder-btn" onClick={onVisualAnalysis} type="button">
        <span className="viewfinder-icon-shell" aria-hidden="true">
          <CameraIcon size={21} strokeWidth={2.25} />
        </span>
        <span className="viewfinder-copy">
          <span className="viewfinder-label">{t('action.visual_help')}</span>
          <span className="viewfinder-note">{t('camera.prompt2')}</span>
        </span>
      </button>
    </>
  );
}
