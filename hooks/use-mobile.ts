'use client'

import { useState, useEffect } from 'react'
import { getDeviceType, getViewportSize, isTouchDevice, getOrientation } from '@/lib/mobile-utils'

export function useMobile() {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [isTouch, setIsTouch] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceType(getDeviceType())
      setViewportSize(getViewportSize())
      setIsTouch(isTouchDevice())
      setOrientation(getOrientation())
    }

    // Initial update
    updateDeviceInfo()

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
    viewportSize,
    isTouch,
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        setConnectionType(connection?.effectiveType || 'unknown')
      }
    }

    updateOnlineStatus()
    updateConnectionType()

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateConnectionType)
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateConnectionType)
      }
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g'
  }
}