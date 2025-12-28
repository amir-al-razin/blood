'use client'

import { usePathname } from 'next/navigation'
import { LanguageSwitcher } from '@/components/language-switcher'

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string
}

interface DashboardHeaderProps {
  user: User
}

const getPageTitle = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 1 && segments[0] === 'dashboard') {
    return 'Dashboard'
  }

  if (segments[1]) {
    const page = segments[1]
    switch (page) {
      case 'requests':
        return 'Blood Requests'
      case 'donors':
        return 'Donor Database'
      case 'matches':
        return 'Donor Matches'
      case 'analytics':
        return 'Analytics & Reports'
      case 'privacy':
        return 'Privacy & Data'
      case 'settings':
        return 'Settings'
      default:
        return page.charAt(0).toUpperCase() + page.slice(1)
    }
  }

  return 'Dashboard'
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="bg-white px-4 md:px-6 py-3 md:py-4 sticky-top-safe border-b">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{pageTitle}</h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Profile */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-full flex items-center justify-center touch-target">
              <span className="text-sm md:text-base font-medium text-red-700">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}