import { useCallback } from 'react';
import { translations, type TranslationKey } from '../i18n/translations';

// O app é só em português. Só existe 'pt' em translations.ts, então o hook
// não aceita nem detecta outro idioma (antes, um navegador em inglês
// derrubava o app, porque translations['en'] não existe).
export function useLanguage() {
  const t = useCallback((key: TranslationKey): string => {
    return translations.pt[key] || key;
  }, []);

  return { currentLanguage: 'pt' as const, t };
}