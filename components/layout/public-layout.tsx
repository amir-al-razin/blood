'use client'

import { Header } from './header'
import { Footer } from './footer'
import { MemberAuthProvider } from '@/components/auth/member-auth-context'

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <MemberAuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </MemberAuthProvider>
  )
}