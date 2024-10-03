import { I18nLite } from '@eartharoid/i18n';
import { importJSON } from '@eartharoid/vite-plugin-i18n/client';

export const languages = Object.keys(import.meta.glob('i18n/**/main.yml')).map((path) => {
  const parts = path.split('/');
  const id = parts[parts.length - 2];
  return id;
});

/**
 * Initialise the i18n object.
 * The i18n object is then returned.
 * @param locale_id The locale to use.
 * @returns The i18n object.
 */
export async function createTranslator(locale_id) {
  const loaded = importJSON(
    await import(`i18n/${locale_id}/_achievements.yml`),
    await import(`i18n/${locale_id}/_addons.yml`),
    await import(`i18n/${locale_id}/_marketplace.yml`),
    await import(`i18n/${locale_id}/_settings.yml`),
    await import(`i18n/${locale_id}/_welcome.yml`),
    await import(`i18n/${locale_id}/main.yml`),
  );
  const i18n = new I18nLite();
  const t = i18n.loadParsed(...loaded).createTranslator();
  return t;
}