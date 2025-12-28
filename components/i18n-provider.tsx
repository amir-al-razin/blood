'use client'

import { ReactNode, useState, useEffect } from 'react'
import { I18nContext_Export as I18nContext, Locale, loadTranslations, getLocaleFromCookie, DEFAULT_LOCALE } from '@/lib/i18n'
import { MobileLoading } from '@/components/ui/mobile-loading'

interface I18nProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

export function I18nProvider({ children, initialLocale = DEFAULT_LOCALE }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [translations, setTranslations] = useState<Record<string, any>>({ common: {}, pages: {} })
  const [isInitialized, setIsInitialized] = useState(false)

  // First effect: Initialize locale from cookie on mount
  useEffect(() => {
    const cookieLocale = getLocaleFromCookie()
    if (cookieLocale !== locale) {
      setLocaleState(cookieLocale)
    } else {
      // If locale hasn't changed, mark as initialized
      setIsInitialized(true)
    }
  }, [])

  // Second effect: Load translations when locale changes
  useEffect(() => {
    const loadLocaleTranslations = async () => {
      try {
        const trans = await loadTranslations(locale)
        setTranslations(trans)
      } catch (error) {
        console.error('Failed to load translations:', error)
        // Set empty translations as fallback
        setTranslations({ common: {}, pages: {} })
      } finally {
        setIsInitialized(true)
      }
    }

    loadLocaleTranslations()
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    // Update cookie
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    }
  }

  // Show loading state while translations are loading to prevent raw key flashing
  if (!isInitialized) {
    return <MobileLoading fullScreen variant="pulse" text="Loading..." />
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        translations
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}
