
import { useApp } from './useApp';
import { translations } from '../lib/i18n';
import type { TranslationKey } from '../lib/i18n';

export const useTranslations = () => {
  const { language } = useApp();

  const t = (key: TranslationKey) => {
    return translations[language][key] || translations['en'][key];
  };

  return t;
};
