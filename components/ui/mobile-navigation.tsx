'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useMobile } from '@/hooks/use-mobile'
import { triggerHapticFeedback } from '@/lib/mobile-utils'
import {
  Menu,
  X,
  Home,
  Heart,
  Users,
  Phone,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  description?: string
  children?: NavigationItem[]
}

interface MobileNavigationProps {
  items: NavigationItem[]
  className?: string
}

export function MobileNavigation({ items, className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const pathname = usePathname()
  const { isMobile, isTouch } = useMobile()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setActiveSubmenu(null)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleMenuToggle = () => {
    if (isTouch) {
      triggerHapticFeedback('light')
    }
    setIsOpen(!isOpen)
  }

  const handleItemClick = (item: NavigationItem) => {
    if (isTouch) {
      triggerHapticFeedback('light')
    }

    if (item.children) {
      setActiveSubmenu(activeSubmenu === item.name ? null : item.name)
    } else {
      setIsOpen(false)
      setActiveSubmenu(null)
    }
  }

  const handleBackClick = () => {
    if (isTouch) {
      triggerHapticFeedback('light')
    }
    setActiveSubmenu(null)
  }

  if (!isMobile) {
    return null
  }

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMenuToggle}
        className={cn(
          'relative z-50 md:hidden',
          'min-h-[44px] min-w-[44px]', // Touch-friendly size
          className
        )}
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-red-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">RedAid</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSubmenu ? (
            // Submenu View
            <div className="p-4">
              <Button
                variant="ghost"
                onClick={handleBackClick}
                className="mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {items
                .find(item => item.name === activeSubmenu)
                ?.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg transition-colors',
                      'min-h-[56px]', // Touch-friendly height
                      pathname === child.href
                        ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                    onClick={() => handleItemClick(child)}
                  >
                    <div className="flex items-center space-x-3">
                      {child.icon && <child.icon className="w-5 h-5" />}
                      <div>
                        <div className="font-medium">{child.name}</div>
                        {child.description && (
                          <div className="text-sm text-gray-500">{child.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            // Main Menu View
            <div className="p-4 space-y-2">
              {items.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <button
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'w-full flex items-center justify-between p-4 rounded-lg transition-colors text-left',
                        'min-h-[56px]', // Touch-friendly height
                        'text-gray-700 hover:bg-gray-50'
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg transition-colors',
                        'min-h-[56px]', // Touch-friendly height
                        pathname === item.href
                          ? 'bg-red-50 text-red-700 border-l-4 border-red-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon && <item.icon className="w-5 h-5" />}
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Example usage with navigation items
export const publicNavigationItems: NavigationItem[] = [
  {
    name: 'Home',
    href: '/',
    icon: Home,
    description: 'Back to homepage'
  },
  {
    name: 'Services',
    href: '#',
    icon: Heart,
    children: [
      {
        name: 'Request Blood',
        href: '/request',
        description: 'Submit a blood request'
      },
      {
        name: 'Donate Blood',
        href: '/donate',
        description: 'Register as a donor'
      }
    ]
  },
  {
    name: 'About',
    href: '/about',
    icon: Users,
    description: 'Learn about our mission'
  },
  {
    name: 'Contact',
    href: '/contact',
    icon: Phone,
    description: 'Get in touch with us'
  }
]