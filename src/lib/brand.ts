export const BRAND = {
  chineseName: '穿越助手',
  shortName: 'Timet',
  fullName: '穿越助手 / Timet',
  englishTagline: 'A time-travel strategy assistant',
} as const;

export function brandTitleForLocale(locale?: string): string {
  return locale?.startsWith('zh') ? BRAND.fullName : BRAND.shortName;
}
