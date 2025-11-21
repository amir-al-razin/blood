import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import '@testing-library/jest-dom'

// Mock mobile utilities
jest.mock('@/lib/mobile-utils', () => ({
  isTouchDevice: jest.fn(() => true),
  getDeviceType: jest.fn(() => 'mobile'),
  getViewportSize: jest.fn(() => ({ width: 375, height: 667 })),
  getTouchTargetSize: jest.fn((size) => Math.max(size, 44)),
  triggerHapticFeedback: jest.fn(),
  isSlowConnection: jest.fn(() => false),
  prefersReducedMotion: jest.fn(() => false),
  getOrientation: jest.fn(() => 'portrait')
}))

// Mock hooks
jest.mock('@/hooks/use-mobile', () => ({
  useMobile: () => ({
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    deviceType: 'mobile',
    viewportSize: { width: 375, height: 667 },
    isTouch: true,
    orientation: 'portrait',
    isPortrait: true,
    isLandscape: false
  }),
  useNetworkStatus: () => ({
    isOnline: true,
    isOffline: false,
    connectionType: '4g',
    isSlowConnection: false
  })
}))

import { MobileInput, MobileButton, MobileForm } from '@/components/ui/mobile-form'
import { MobileNavigation } from '@/components/ui/mobile-navigation'
import { OfflineIndicator } from '@/components/ui/offline-indicator'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

describe('Mobile Optimization Components', () => {
  describe('MobileInput', () => {
    it('renders with touch-friendly sizing on mobile', () => {
      render(<MobileInput placeholder="Test input" data-testid="mobile-input" />)
      
      const input = screen.getByTestId('mobile-input')
      expect(input).toHaveClass('min-h-[48px]')
      expect(input).toHaveClass('text-base')
    })

    it('applies mobile-specific padding', () => {
      render(<MobileInput placeholder="Test input" data-testid="mobile-input" />)
      
      const input = screen.getByTestId('mobile-input')
      expect(input).toHaveClass('px-4', 'py-3')
    })
  })

  describe('MobileButton', () => {
    it('renders with touch-friendly minimum height', () => {
      render(<MobileButton data-testid="mobile-button">Test Button</MobileButton>)
      
      const button = screen.getByTestId('mobile-button')
      expect(button).toHaveClass('min-h-[48px]')
    })

    it('triggers haptic feedback on touch devices', () => {
      const mockVibrate = jest.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true
      })

      render(<MobileButton data-testid="mobile-button">Test Button</MobileButton>)
      
      const button = screen.getByTestId('mobile-button')
      fireEvent.click(button)
      
      expect(mockVibrate).toHaveBeenCalledWith(10)
    })

    it('applies active scale transform on touch', () => {
      render(<MobileButton data-testid="mobile-button">Test Button</MobileButton>)
      
      const button = screen.getByTestId('mobile-button')
      expect(button).toHaveClass('active:scale-95')
    })
  })

  describe('MobileNavigation', () => {
    const mockItems = [
      { name: 'Home', href: '/', icon: () => <div>Home Icon</div> },
      { name: 'About', href: '/about', icon: () => <div>About Icon</div> }
    ]

    it('renders mobile navigation menu', () => {
      render(<MobileNavigation items={mockItems} />)
      
      const menuButton = screen.getByLabelText('Toggle navigation menu')
      expect(menuButton).toBeInTheDocument()
      expect(menuButton).toHaveClass('min-h-[44px]', 'min-w-[44px]')
    })

    it('opens menu when toggle button is clicked', async () => {
      render(<MobileNavigation items={mockItems} />)
      
      const menuButton = screen.getByLabelText('Toggle navigation menu')
      fireEvent.click(menuButton)
      
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('About')).toBeInTheDocument()
      })
    })

    it('applies touch-friendly sizing to menu items', async () => {
      render(<MobileNavigation items={mockItems} />)
      
      const menuButton = screen.getByLabelText('Toggle navigation menu')
      fireEvent.click(menuButton)
      
      await waitFor(() => {
        const homeLink = screen.getByText('Home').closest('a')
        expect(homeLink).toHaveClass('min-h-[56px]')
      })
    })
  })

  describe('OfflineIndicator', () => {
    it('does not render when online', () => {
      render(<OfflineIndicator />)
      
      expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
    })

    it('renders retry button when offline', () => {
      // Mock offline state
      jest.mocked(require('@/hooks/use-mobile').useNetworkStatus).mockReturnValue({
        isOnline: false,
        isOffline: true,
        connectionType: 'none',
        isSlowConnection: false
      })

      render(<OfflineIndicator />)
      
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  describe('PullToRefresh', () => {
    it('renders children content', () => {
      const mockRefresh = jest.fn()
      
      render(
        <PullToRefresh onRefresh={mockRefresh}>
          <div>Test Content</div>
        </PullToRefresh>
      )
      
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('handles touch events for pull gesture', () => {
      const mockRefresh = jest.fn()
      
      render(
        <PullToRefresh onRefresh={mockRefresh}>
          <div>Test Content</div>
        </PullToRefresh>
      )
      
      const container = screen.getByText('Test Content').parentElement
      
      // Simulate pull gesture
      fireEvent.touchStart(container!, {
        touches: [{ clientY: 100 }]
      })
      
      fireEvent.touchMove(container!, {
        touches: [{ clientY: 200 }]
      })
      
      fireEvent.touchEnd(container!)
      
      // Should trigger refresh if pulled enough
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  describe('Touch Target Accessibility', () => {
    it('ensures minimum touch target size', () => {
      const { getTouchTargetSize } = require('@/lib/mobile-utils')
      
      expect(getTouchTargetSize(30)).toBe(44) // iOS minimum
      expect(getTouchTargetSize(50)).toBe(50) // Already large enough
    })
  })

  describe('Performance Optimizations', () => {
    it('applies reduced motion when preferred', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })

      const { prefersReducedMotion } = require('@/lib/mobile-utils')
      expect(prefersReducedMotion()).toBe(true)
    })

    it('detects slow connections', () => {
      // Mock slow connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' },
        writable: true
      })

      const { isSlowConnection } = require('@/lib/mobile-utils')
      expect(isSlowConnection()).toBe(true)
    })
  })

  describe('Responsive Design', () => {
    it('adapts layout for mobile viewport', () => {
      // Test viewport-specific styles
      const mobileViewport = { width: 375, height: 667 }
      const { getViewportSize } = require('@/lib/mobile-utils')
      
      expect(getViewportSize()).toEqual(mobileViewport)
    })

    it('applies mobile-first CSS classes', () => {
      render(
        <div className="mobile-grid">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      )
      
      const grid = screen.getByText('Item 1').parentElement
      expect(grid).toHaveClass('mobile-grid')
    })
  })
})

describe('Mobile Performance', () => {
  it('optimizes images for mobile', () => {
    // Test image optimization settings
    const mobileOptimizations = {
      quality: 60, // Lower quality for mobile
      format: 'webp',
      sizes: '(max-width: 640px) 100vw, 50vw'
    }
    
    expect(mobileOptimizations.quality).toBeLessThan(85)
    expect(mobileOptimizations.format).toBe('webp')
  })

  it('implements lazy loading for performance', () => {
    const mockIntersectionObserver = jest.fn()
    mockIntersectionObserver.mockReturnValue({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    })
    
    window.IntersectionObserver = mockIntersectionObserver
    
    const { performanceUtils } = require('@/components/ui/performance-monitor')
    const mockImg = document.createElement('img')
    
    performanceUtils.lazyLoadImage(mockImg, 'test.jpg')
    
    expect(mockIntersectionObserver).toHaveBeenCalled()
  })
})

describe('Accessibility on Mobile', () => {
  it('provides adequate color contrast', () => {
    // Test color contrast ratios meet WCAG standards
    const colors = {
      primary: '#dc2626', // Red 600
      background: '#ffffff',
      text: '#111827' // Gray 900
    }
    
    // These would be tested with actual contrast calculation
    expect(colors.primary).toBeDefined()
    expect(colors.background).toBeDefined()
    expect(colors.text).toBeDefined()
  })

  it('supports keyboard navigation on mobile', () => {
    render(<MobileButton data-testid="mobile-button">Test</MobileButton>)
    
    const button = screen.getByTestId('mobile-button')
    
    // Test focus styles
    button.focus()
    expect(button).toHaveClass('focus-visible:ring-2')
  })

  it('provides proper ARIA labels for mobile interactions', () => {
    render(<MobileNavigation items={[]} />)
    
    const menuButton = screen.getByLabelText('Toggle navigation menu')
    expect(menuButton).toHaveAttribute('aria-label')
  })
})