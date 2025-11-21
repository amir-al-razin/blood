'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Home, Users, Phone } from 'lucide-react'
import { MobileNavigation, publicNavigationItems } from '@/components/ui/mobile-navigation'
import { useMobile } from '@/hooks/use-mobile'

export function Header() {
  const { isMobile } = useMobile()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className="bg-white shadow-sm border-b sticky-top-safe z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Mobile Navigation */}
          {isMobile && (
            <MobileNavigation 
              items={publicNavigationItems}
              className="mr-4"
            />
          )}

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-1 md:flex-none">
            <div className="bg-red-600 p-2 rounded-full touch-target">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900">RedAid</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-red-600 transition-colors touch-target flex items-center justify-center"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Mobile: Show only icons */}
            {isMobile ? (
              <>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="touch-target"
                  asChild
                >
                  <Link href="/request" aria-label="Need Blood">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="icon"
                  className="bg-red-600 hover:bg-red-700 touch-target" 
                  asChild
                >
                  <Link href="/donate" aria-label="Become a Donor">
                    <Users className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              /* Desktop: Show full text */
              <>
                <Button variant="outline" className="touch-target" asChild>
                  <Link href="/request">Need Blood</Link>
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 touch-target" asChild>
                  <Link href="/donate">Become a Donor</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}