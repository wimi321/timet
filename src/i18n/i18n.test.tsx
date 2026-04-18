import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from './index';
import { SUPPORTED_LANGUAGES } from './languages';
import { messages } from './messages';

function TestComponent() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="current-locale">{locale}</span>
      <span data-testid="translated-title">{t('header.title')}</span>
      <span data-testid="translated-kicker">{t('hero.kicker')}</span>
      <button onClick={() => setLocale('zh-CN')}>Switch CN</button>
      <button onClick={() => setLocale('ja')}>Switch JA</button>
      <button onClick={() => setLocale('de')}>Switch DE</button>
    </div>
  );
}

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value; }),
  clear: vi.fn(() => { Object.keys(mockStorage).forEach((key) => delete mockStorage[key]); }),
};

vi.stubGlobal('localStorage', mockLocalStorage);

describe('i18n Module', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, 'languages', {
      value: ['en-US', 'en'],
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('detects the default language and falls back to English', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('en');
    expect(screen.getByTestId('translated-title').textContent).toBe('Timet');
  });

  it('prefers saved locale from storage', () => {
    localStorage.setItem('timet_locale', 'zh-CN');
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('zh-CN');
    expect(screen.getByTestId('translated-title').textContent).toBe('穿越助手 / Timet');
  });

  it('can manually switch language and persist the new key', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    act(() => {
      screen.getByText('Switch CN').click();
    });

    expect(screen.getByTestId('current-locale').textContent).toBe('zh-CN');
    expect(screen.getByTestId('translated-title').textContent).toBe('穿越助手 / Timet');
    expect(localStorage.getItem('timet_locale')).toBe('zh-CN');
  });

  it('sets document direction to ltr for all supported languages', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    act(() => {
      screen.getByText('Switch DE').click();
    });

    expect(screen.getByTestId('current-locale').textContent).toBe('de');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('provides translated kicker for German locale', () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    act(() => {
      screen.getByText('Switch DE').click();
    });

    expect(screen.getByTestId('translated-kicker').textContent).toBe('STRATEGE FÜR ZEITREISENDE');
  });

  it('maps regional Chinese locales to the supported locale set', () => {
    Object.defineProperty(window.navigator, 'languages', {
      value: ['zh-HK'],
      configurable: true,
    });

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>,
    );

    expect(screen.getByTestId('current-locale').textContent).toBe('zh-TW');
  });

  it('keeps every supported locale complete for visible UI keys', () => {
    const englishKeys = Object.keys(messages.en);

    for (const language of SUPPORTED_LANGUAGES) {
      const localeMessages = messages[language.code];
      const missing = englishKeys.filter((key) => !(key in localeMessages));
      expect(missing, `${language.code} is missing translations`).toEqual([]);
    }
  });
});
