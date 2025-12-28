'use client'

import { createContext, useContext, ReactNode } from 'react'

export type Locale = 'en' | 'bn'

export type Namespace = 'common' | 'pages'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  translations: Record<string, any>
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function useLocale(): Locale {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useLocale must be used within I18nProvider')
  }
  return context.locale
}

export function useTranslations(namespace: Namespace = 'common') {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslations must be used within I18nProvider')
  }

  return (key: string, defaultValue?: string): string => {
    try {
      const keys = key.split('.')
      let value: any = context.translations[namespace]

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k]
        } else {
          // Return default or key itself as fallback
          return defaultValue || key
        }
      }

      return typeof value === 'string' ? value : defaultValue || key
    } catch {
      return defaultValue || key
    }
  }
}

export function useSetLocale() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useSetLocale must be used within I18nProvider')
  }
  return context.setLocale
}

export const I18nContext_Export = I18nContext

export const AVAILABLE_LOCALES: Locale[] = ['en', 'bn']
export const DEFAULT_LOCALE: Locale = 'en'

export async function loadTranslations(locale: Locale): Promise<Record<string, any>> {
  try {
    const [common, pages] = await Promise.all([
      fetch(`/locales/${locale}/common.json`).then(r => r.json()),
      fetch(`/locales/${locale}/pages.json`).then(r => r.json())
    ])
    return { common, pages }
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error)
    // Fallback to English
    if (locale !== 'en') {
      return loadTranslations('en')
    }
    return { common: {}, pages: {} }
  }
}

export function getLocaleFromCookie(): Locale {
  // Client-side only - safe check for window/document
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
    
    if (cookie) {
      const value = cookie.split('=')[1]
      return (AVAILABLE_LOCALES.includes(value as Locale) ? value : DEFAULT_LOCALE) as Locale
    }
  } catch (error) {
    console.error('Failed to read locale from cookie:', error)
  }
  
  return DEFAULT_LOCALE
}

export function setLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`
}
