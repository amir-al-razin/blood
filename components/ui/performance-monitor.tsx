'use client'

import { useEffect, useState } from 'react'
import { useNetworkStatus } from '@/hooks/use-mobile'
import { getBatteryStatus, isSlowConnection } from '@/lib/mobile-utils'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage?: number
  batteryLevel?: number
  connectionSpeed?: string
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  enableLogging?: boolean
}

export function PerformanceMonitor({ 
  onMetricsUpdate, 
  enableLogging = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const { connectionType, isSlowConnection: slowConnection } = useNetworkStatus()

  useEffect(() => {
    const measurePerformance = async () => {
      // Measure page load time
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart

      // Measure render time
      const paintEntries = performance.getEntriesByType('paint')
      const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      const renderTime = firstContentfulPaint?.startTime || 0

      // Get memory usage (if available)
      let memoryUsage: number | undefined
      if ('memory' in performance) {
        const memory = (performance as any).memory
        memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
      }

      // Get battery status
      const battery = await getBatteryStatus()

      const newMetrics: PerformanceMetrics = {
        loadTime,
        renderTime,
        memoryUsage,
        batteryLevel: battery.level,
        connectionSpeed: connectionType
      }

      setMetrics(newMetrics)
      onMetricsUpdate?.(newMetrics)

      if (enableLogging) {
        console.log('Performance Metrics:', newMetrics)
      }

      // Log performance issues
      if (loadTime > 3000) {
        console.warn('Slow page load detected:', loadTime + 'ms')
      }

      if (memoryUsage && memoryUsage > 50) {
        console.warn('High memory usage detected:', memoryUsage + 'MB')
      }

      if (slowConnection) {
        console.info('Slow connection detected, optimizing for performance')
      }
    }

    // Measure performance after page load
    if (document.readyState === 'complete') {
      measurePerformance()
    } else {
      window.addEventListener('load', measurePerformance)
      return () => window.removeEventListener('load', measurePerformance)
    }
  }, [connectionType, slowConnection, onMetricsUpdate, enableLogging])

  // Monitor ongoing performance
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && enableLogging) {
          console.log(`Performance measure: ${entry.name} - ${entry.duration}ms`)
        }
        
        if (entry.entryType === 'navigation' && enableLogging) {
          const navEntry = entry as PerformanceNavigationTiming
          console.log('Navigation timing:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            load: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstByte: navEntry.responseStart - navEntry.requestStart
          })
        }
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation'] })

    return () => observer.disconnect()
  }, [enableLogging])

  // Don't render anything in production unless explicitly needed
  if (process.env.NODE_ENV === 'production' && !enableLogging) {
    return null
  }

  return null
}

// Hook for using performance metrics in components
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const { isSlowConnection } = useNetworkStatus()

  const measureComponentRender = (componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow component render: ${componentName} - ${renderTime.toFixed(2)}ms`)
      }
      
      performance.mark(`${componentName}-render-end`)
      performance.measure(`${componentName}-render`, `${componentName}-render-start`, `${componentName}-render-end`)
    }
  }

  const optimizeForConnection = () => {
    return {
      shouldLazyLoad: isSlowConnection,
      imageQuality: isSlowConnection ? 60 : 85,
      shouldPreload: !isSlowConnection,
      chunkSize: isSlowConnection ? 'small' : 'normal'
    }
  }

  return {
    metrics,
    measureComponentRender,
    optimizeForConnection,
    isSlowConnection
  }
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function for performance-sensitive operations
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function for scroll/resize events
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Lazy load images with intersection observer
  lazyLoadImage: (img: HTMLImageElement, src: string) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      })
    })
    
    observer.observe(img)
  },

  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  },

  // Memory cleanup utility
  cleanupMemory: () => {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window) {
      (window as any).gc()
    }
    
    // Clear performance entries to free memory
    performance.clearMarks()
    performance.clearMeasures()
  }
}