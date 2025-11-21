'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'
import { getTouchTargetSize } from '@/lib/mobile-utils'

// Mobile-optimized input with touch-friendly sizing
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  touchOptimized?: boolean
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, touchOptimized = true, ...props }, ref) => {
    const { isMobile, isTouch } = useMobile()
    
    return (
      <input
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Mobile optimizations
          touchOptimized && isMobile && [
            'min-h-[48px]', // Touch-friendly height
            'text-base', // Prevent zoom on iOS
            'px-4 py-3', // Larger padding for easier touch
          ],
          // Touch-specific styles
          isTouch && [
            'focus:ring-4', // Larger focus ring for touch
            'focus:ring-opacity-50',
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileInput.displayName = 'MobileInput'

// Mobile-optimized textarea
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  touchOptimized?: boolean
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ className, touchOptimized = true, ...props }, ref) => {
    const { isMobile, isTouch } = useMobile()
    
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Mobile optimizations
          touchOptimized && isMobile && [
            'min-h-[120px]', // Larger minimum height
            'text-base', // Prevent zoom on iOS
            'px-4 py-3', // Larger padding
          ],
          // Touch-specific styles
          isTouch && [
            'focus:ring-4',
            'focus:ring-opacity-50',
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileTextarea.displayName = 'MobileTextarea'

// Mobile-optimized button with haptic feedback
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  touchOptimized?: boolean
  hapticFeedback?: boolean
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    touchOptimized = true,
    hapticFeedback = true,
    onClick,
    ...props 
  }, ref) => {
    const { isMobile, isTouch } = useMobile()
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback && isTouch && 'vibrate' in navigator) {
        navigator.vibrate(10) // Light haptic feedback
      }
      onClick?.(e)
    }
    
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50',
          // Base variants
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
          },
          // Base sizes
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          // Mobile optimizations
          touchOptimized && isMobile && [
            'min-h-[48px]', // Touch-friendly minimum height
            'px-6', // Larger horizontal padding
            'text-base', // Larger text for readability
          ],
          // Touch-specific styles
          isTouch && [
            'active:scale-95', // Visual feedback on touch
            'transition-transform',
          ],
          className
        )}
        ref={ref}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
MobileButton.displayName = 'MobileButton'

// Mobile-optimized select component
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  touchOptimized?: boolean
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ className, touchOptimized = true, ...props }, ref) => {
    const { isMobile } = useMobile()
    
    return (
      <select
        className={cn(
          'flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          // Mobile optimizations
          touchOptimized && isMobile && [
            'min-h-[48px]', // Touch-friendly height
            'text-base', // Prevent zoom on iOS
            'px-4 py-3', // Larger padding
          ],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
MobileSelect.displayName = 'MobileSelect'

// Form container with mobile optimizations
interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function MobileForm({ className, children, ...props }: MobileFormProps) {
  const { isMobile } = useMobile()
  
  return (
    <form
      className={cn(
        'space-y-4',
        // Mobile optimizations
        isMobile && [
          'space-y-6', // More spacing on mobile
          'px-4', // Horizontal padding
        ],
        className
      )}
      {...props}
    >
      {children}
    </form>
  )
}

// Form field wrapper with mobile-optimized spacing
interface MobileFormFieldProps {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function MobileFormField({ 
  label, 
  error, 
  required, 
  children, 
  className 
}: MobileFormFieldProps) {
  const { isMobile } = useMobile()
  
  return (
    <div className={cn('space-y-2', isMobile && 'space-y-3', className)}>
      {label && (
        <label className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          isMobile && 'text-base' // Larger text on mobile
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className={cn(
          'text-sm text-destructive',
          isMobile && 'text-base' // Larger error text on mobile
        )}>
          {error}
        </p>
      )}
    </div>
  )
}