import { Globe } from 'lucide-react';
import { useI18n } from '../i18n';
import { SUPPORTED_LANGUAGES, LanguageCode } from '../i18n/languages';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="language-switcher">
      <select
        className="language-select"
        aria-label={t('language.selection')}
        title={t('language.selection')}
        value={locale}
        onChange={(e) => setLocale(e.target.value as LanguageCode)}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
      <Globe
        size={12}
        className="language-icon"
      />
    </div>
  );
}
