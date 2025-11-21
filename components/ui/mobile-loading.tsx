'use client'

import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { Loader2, Heart } from 'lucide-react'

interface MobileLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
  fullScreen?: boolean
  variant?: 'spinner' | 'pulse' | 'skeleton' | 'dots'
}

export function MobileLoading({
  size = 'md',
  text,
  className,
  fullScreen = false,
  variant = 'spinner'
}: MobileLoadingProps) {
  const { isMobile } = useMobile()

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center space-y-3">
      <Loader2 className={cn(
        'animate-spin text-red-600',
        sizeClasses[size],
        isMobile && size === 'md' && 'w-10 h-10' // Slightly larger on mobile
      )} />
      {text && (
        <p className={cn(
          'text-gray-600 font-medium',
          textSizeClasses[size],
          isMobile && 'text-center'
        )}>
          {text}
        </p>
      )}
    </div>
  )

  const LoadingPulse = () => (
    <div className="flex flex-col items-center space-y-3">
      <div className={cn(
        'bg-red-600 rounded-full animate-pulse',
        sizeClasses[size]
      )}>
        <Heart className="w-full h-full text-white p-1" />
      </div>
      {text && (
        <p className={cn(
          'text-gray-600 font-medium animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  const LoadingSkeleton = () => (
    <div className="space-y-3 w-full max-w-sm">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>
  )

  const LoadingDots = () => (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-red-600 rounded-full animate-bounce',
              size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
            )}
            style={{
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      {text && (
        <p className={cn(
          'text-gray-600 font-medium',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  )

  const renderLoading = () => {
    switch (variant) {
      case 'pulse':
        return <LoadingPulse />
      case 'skeleton':
        return <LoadingSkeleton />
      case 'dots':
        return <LoadingDots />
      default:
        return <LoadingSpinner />
    }
  }

  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center',
        isMobile && 'px-4',
        className
      )}>
        {renderLoading()}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex items-center justify-center p-8',
      isMobile && 'p-6',
      className
    )}>
      {renderLoading()}
    </div>
  )
}

// Skeleton loading components for specific UI elements
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  const { isMobile } = useMobile()

  if (isMobile) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('animate-pulse', className)}>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="flex space-x-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
        </div>
        
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-100">
            <div className="flex space-x-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-24"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-6', className)}>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
      <div className="flex space-x-4">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  )
}