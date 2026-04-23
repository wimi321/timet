import { useI18n } from '../i18n';

export function HeroPanel() {
  const { t } = useI18n();

  return (
    <>
      <section className="hero-panel">
        <div className="hero-ambient" aria-hidden="true" />
        <p className="hero-kicker">{t('hero.kicker')}</p>
        <h1>{t('hero.title')}</h1>
        <p className="hero-subtitle">{t('hero.subtitle')}</p>
        <div className="hero-meta-grid" aria-label={t('hero.trust_label')}>
          <span>{t('hero.meta_offline')}</span>
          <span>{t('hero.meta_route_pack')}</span>
          <span>{t('hero.meta_web_preview')}</span>
        </div>
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
