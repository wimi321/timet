import { useI18n } from '../i18n';

export function HeroPanel() {
  const { t } = useI18n();

  return (
    <>
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
    </>
  );
}
