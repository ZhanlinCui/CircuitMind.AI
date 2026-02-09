import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { reapplyLegacyTextTranslation } from '../lib/legacyTextTranslator';
import { Select } from './ui/select';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const activeLang = (i18n.language || i18n.resolvedLanguage || 'en')
    .toLowerCase()
    .split('-')[0];
  const applyTranslationNow = (lang?: 'en' | 'zh') => {
    if (typeof window !== 'undefined') {
      reapplyLegacyTextTranslation(i18n, lang);
      window.requestAnimationFrame(() => {
        reapplyLegacyTextTranslation(i18n, lang);
      });
    }
  };

  const setLanguage = async (lang: 'en' | 'zh') => {
    await i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', lang);
      document.documentElement.lang = lang;
    }
    applyTranslationNow(lang);
  };

  return (
    <div
      className='inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm'
      data-no-legacy-translate='true'
    >
      <Globe className='ml-0.5 h-4 w-4 text-slate-400' aria-hidden='true' />
      <Select
        value={activeLang}
        onChange={(value) => {
          const next = value === 'zh' ? 'zh' : 'en';
          void setLanguage(next);
        }}
        placeholder={t('app.switch_language')}
        options={[
          { label: 'English', value: 'en' },
          { label: '中文', value: 'zh' },
        ]}
        className='w-28 !rounded-none !border-0 !bg-transparent text-sm !shadow-none !ring-0 !ring-offset-0 focus:!ring-0 focus-visible:!ring-0 active:!ring-0 !outline-none'
      />
    </div>
  );
}
