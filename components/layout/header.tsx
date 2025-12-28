'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Users, LogIn, LogOut } from 'lucide-react'
import { MobileNavigation, publicNavigationItems } from '@/components/ui/mobile-navigation'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useMobile } from '@/hooks/use-mobile'
import { signOutUser } from '@/lib/firebase-auth'
import { useMemberAuth } from '@/components/auth/member-auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Header() {
  const { isMobile } = useMobile()
  // Use member auth context - only shows MEMBERS, not admins
  const { user, member, loading } = useMemberAuth()

  const handleSignOut = async () => {
    await signOutUser()
    window.location.href = '/'
  }

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Only show logged-in state if user is a MEMBER (has member profile)
  const isMemberLoggedIn = user && member

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
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Auth State - Only show for MEMBERS, not admins */}
            {!loading && isMemberLoggedIn ? (
              // Member logged in - show member menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} alt={member.name || 'Member'} />
                      <AvatarFallback className="bg-red-100 text-red-600">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{member.name || 'Member'}</p>
                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/member/dashboard" className="cursor-pointer">
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Not logged in as member - show login button only (CTAs are in hero section)
              <>
                {isMobile ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target"
                    asChild
                  >
                    <Link href="/member/login" aria-label="Login">
                      <LogIn className="h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="ghost" className="touch-target" asChild>
                    <Link href="/member/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}