'use client'

import { Toaster } from 'sonner'
import { I18nProvider } from './i18n-provider'
import { MemberAuthProvider } from './auth/member-auth-context'
import { DEFAULT_LOCALE } from '@/lib/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale={DEFAULT_LOCALE}>
      <MemberAuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </MemberAuthProvider>
    </I18nProvider>
  )
}