'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      case 'settings':
        return 'Settings'
      default:
        return page.charAt(0).toUpperCase() + page.slice(1)
    }
  }
  
  return 'Dashboard'
}

const getBreadcrumbs = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = []
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')
    
    let name = segment
    if (segment === 'dashboard') {
      name = 'Dashboard'
    } else if (segment === 'requests') {
      name = 'Blood Requests'
    } else if (segment === 'donors') {
      name = 'Donors'
    } else if (segment === 'matches') {
      name = 'Matches'
    } else if (segment === 'analytics') {
      name = 'Analytics'
    } else if (segment === 'settings') {
      name = 'Settings'
    }
    
    breadcrumbs.push({ name, href })
  }
  
  return breadcrumbs
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                  {crumb.name}
                </span>
              </div>
            ))}
          </nav>
          
          {/* Page Title */}
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search..."
              className="pl-10 w-64"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-red-700">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">
                {user.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}