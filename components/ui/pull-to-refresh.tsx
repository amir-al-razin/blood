'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { triggerHapticFeedback } from '@/lib/mobile-utils'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  className?: string
  threshold?: number
  disabled?: boolean
  refreshingText?: string
  pullText?: string
  releaseText?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh'
}: PullToRefreshProps) {
  const { isMobile, isTouch } = useMobile()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [canRefresh, setCanRefresh] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)

  const handleRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return

    setIsRefreshing(true)
    
    if (isTouch) {
      triggerHapticFeedback('medium')
    }

    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
      setIsPulling(false)
      setCanRefresh(false)
    }
  }, [onRefresh, disabled, isRefreshing, isTouch])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const container = containerRef.current
    if (!container || container.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    isDragging.current = true
  }, [disabled, isRefreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return

    const container = containerRef.current
    if (!container || container.scrollTop > 0) return

    currentY.current = e.touches[0].clientY
    const distance = Math.max(0, currentY.current - startY.current)
    
    if (distance > 0) {
      e.preventDefault()
      
      // Apply resistance curve for natural feel
      const resistance = Math.min(distance / 2.5, threshold * 1.5)
      setPullDistance(resistance)
      setIsPulling(true)
      
      const shouldRefresh = resistance >= threshold
      if (shouldRefresh !== canRefresh) {
        setCanRefresh(shouldRefresh)
        if (shouldRefresh && isTouch) {
          triggerHapticFeedback('light')
        }
      }
    }
  }, [disabled, isRefreshing, threshold, canRefresh, isTouch])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return

    isDragging.current = false

    if (canRefresh && !isRefreshing) {
      handleRefresh()
    } else {
      // Animate back to original position
      setPullDistance(0)
      setIsPulling(false)
      setCanRefresh(false)
    }
  }, [canRefresh, isRefreshing, handleRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !isMobile || !isTouch) return

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, isTouch, handleTouchStart, handleTouchMove, handleTouchEnd])

  // Don't render pull-to-refresh on desktop
  if (!isMobile || !isTouch) {
    return <div className={className}>{children}</div>
  }

  const getStatusText = () => {
    if (isRefreshing) return refreshingText
    if (canRefresh) return releaseText
    if (isPulling) return pullText
    return ''
  }

  const getIconRotation = () => {
    if (isRefreshing) return 'animate-spin'
    if (canRefresh) return 'rotate-180'
    return ''
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-auto',
        'touch-pan-y', // Allow vertical panning
        className
      )}
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'bg-white border-b shadow-sm z-10',
          'transition-all duration-300 ease-out',
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          height: Math.min(pullDistance, threshold),
          transform: `translateY(-${Math.min(pullDistance, threshold)}px)`
        }}
      >
        <div className="flex items-center space-x-2 text-gray-600">
          <RefreshCw 
            className={cn(
              'w-5 h-5 transition-transform duration-300',
              getIconRotation()
            )} 
          />
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className={cn(isRefreshing && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  )
}

// Hook for programmatic refresh
export function usePullToRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refresh = useCallback(async (refreshFn: () => Promise<void> | void) => {
    setIsRefreshing(true)
    try {
      await refreshFn()
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  return {
    isRefreshing,
    refresh
  }
}