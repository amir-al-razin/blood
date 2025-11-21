'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useNetworkStatus } from '@/hooks/use-mobile'
import { Loader2 } from 'lucide-react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  quality,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { isSlowConnection } = useNetworkStatus()

  // Adjust quality based on connection speed
  const optimizedQuality = quality || (isSlowConnection ? 60 : 85)

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || `
    (max-width: 640px) 100vw,
    (max-width: 768px) 50vw,
    (max-width: 1024px) 33vw,
    25vw
  `

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number, h: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#f3f4f6'
      ctx.fillRect(0, 0, w, h)
    }
    return canvas.toDataURL()
  }

  const defaultBlurDataURL = blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400 text-sm',
          className
        )}
        style={{ width, height }}
      >
        Failed to load image
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        sizes={responsiveSizes}
        quality={optimizedQuality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        {...props}
      />
    </div>
  )
}

// Progressive image component that loads different sizes based on viewport
interface ProgressiveImageProps extends Omit<OptimizedImageProps, 'src'> {
  srcSet: {
    mobile: string
    tablet: string
    desktop: string
  }
}

export function ProgressiveImage({
  srcSet,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(srcSet.mobile)

  useEffect(() => {
    const updateSrc = () => {
      const width = window.innerWidth
      
      if (width < 640) {
        setCurrentSrc(srcSet.mobile)
      } else if (width < 1024) {
        setCurrentSrc(srcSet.tablet)
      } else {
        setCurrentSrc(srcSet.desktop)
      }
    }

    updateSrc()
    window.addEventListener('resize', updateSrc)
    
    return () => window.removeEventListener('resize', updateSrc)
  }, [srcSet])

  return (
    <OptimizedImage
      src={currentSrc}
      alt={alt}
      className={className}
      {...props}
    />
  )
}