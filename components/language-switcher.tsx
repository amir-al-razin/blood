'use client'

import { useLocale, useSetLocale, useTranslations } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useTranslations('common')

  const handleLanguageChange = (newLocale: 'en' | 'bn') => {
    setLocale(newLocale)
    // Update URL param and reload
    const url = new URL(window.location.href)
    url.searchParams.set('lang', newLocale)
    window.location.href = url.toString()
  }

  const currentLanguage = locale === 'en' ? t('english') : t('bangla')
  const currentFlag = locale === 'en' ? '🇬🇧' : '🇧🇩'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title={t('language')}
        >
          <span>{currentFlag}</span>
          <span className="hidden sm:inline">{currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇬🇧</span>
          <span>{t('english')}</span>
          {locale === 'en' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('bn')}
          className={locale === 'bn' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇧🇩</span>
          <span>{t('bangla')}</span>
          {locale === 'bn' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
