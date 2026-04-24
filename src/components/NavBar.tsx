import { ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n';
import { brandTitleForLocale } from '../lib/brand';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavBarProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  statusLine?: string;
}

export function NavBar({ showBack, onBack, title, statusLine }: NavBarProps) {
  const { t, locale } = useI18n();

  return (
    <header className={`header ${showBack ? 'header-chat' : 'header-home'}`}>
      <div className="header-main">
        <div className="header-side">
          {showBack ? (
            <button
              onClick={onBack}
              className="nav-back-btn"
              aria-label={t('action.clear_chat') || 'Go back'}
              type="button"
            >
              <ArrowLeft
                size={24}
                style={{ transform: document.documentElement.dir === 'rtl' ? 'rotate(180deg)' : 'none' }}
              />
            </button>
          ) : (
            <div className="header-side-placeholder" aria-hidden="true" />
          )}
        </div>

        <div className="header-title">
          <img className="brand-title-mark" src="/icon-192.png" alt="" aria-hidden="true" />
          <span>{title || brandTitleForLocale(locale)}</span>
        </div>

        <div className="header-side">
          <LanguageSwitcher />
        </div>
      </div>

      {statusLine && (
        <div className="status-badge">
          {statusLine}
        </div>
      )}
    </header>
  );
}
