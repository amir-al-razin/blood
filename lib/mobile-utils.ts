/**
 * Mobile optimization utilities
 */

// Touch detection
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Device detection
export const getDeviceType = () => {
  if (typeof window === 'undefined') return 'desktop'
  
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent)
  
  if (isMobile && !isTablet) return 'mobile'
  if (isTablet) return 'tablet'
  return 'desktop'
}

// Viewport utilities
export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

// Touch-friendly sizing
export const getTouchTargetSize = (baseSize: number) => {
  const deviceType = getDeviceType()
  
  switch (deviceType) {
    case 'mobile':
      return Math.max(baseSize, 44) // iOS minimum touch target
    case 'tablet':
      return Math.max(baseSize, 40)
    default:
      return baseSize
  }
}

// Safe area utilities for mobile devices
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }
  
  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0')
  }
}

// Performance utilities
export const isSlowConnection = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return false
  
  const connection = (navigator as any).connection
  return connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
}

// Reduced motion preference
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Battery status (for performance optimization)
export const getBatteryStatus = async () => {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return { level: 1, charging: true }
  }
  
  try {
    const battery = await (navigator as any).getBattery()
    return {
      level: battery.level,
      charging: battery.charging
    }
  } catch {
    return { level: 1, charging: true }
  }
}

// Orientation utilities
export const getOrientation = () => {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
}

// Haptic feedback (for supported devices)
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30]
  }
  
  navigator.vibrate(patterns[type])
}