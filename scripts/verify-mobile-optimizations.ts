#!/usr/bin/env tsx

/**
 * Script to verify mobile optimizations are properly implemented
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface OptimizationCheck {
  name: string
  check: () => boolean
  description: string
}

const checks: OptimizationCheck[] = [
  {
    name: 'Mobile Utils',
    check: () => existsSync(join(process.cwd(), 'lib/mobile-utils.ts')),
    description: 'Mobile utility functions for device detection and optimization'
  },
  {
    name: 'Mobile Hooks',
    check: () => existsSync(join(process.cwd(), 'hooks/use-mobile.ts')),
    description: 'React hooks for mobile device detection and network status'
  },
  {
    name: 'Mobile Components',
    check: () => {
      const components = [
        'components/ui/mobile-form.tsx',
        'components/ui/mobile-navigation.tsx',
        'components/ui/mobile-table.tsx',
        'components/ui/optimized-image.tsx',
        'components/ui/offline-indicator.tsx',
        'components/ui/pull-to-refresh.tsx',
        'components/ui/mobile-loading.tsx'
      ]
      return components.every(component => existsSync(join(process.cwd(), component)))
    },
    description: 'Mobile-optimized UI components'
  },
  {
    name: 'PWA Manifest',
    check: () => existsSync(join(process.cwd(), 'public/manifest.json')),
    description: 'Progressive Web App manifest for mobile app-like experience'
  },
  {
    name: 'Mobile CSS Optimizations',
    check: () => {
      const cssPath = join(process.cwd(), 'app/globals.css')
      if (!existsSync(cssPath)) return false
      
      const css = readFileSync(cssPath, 'utf-8')
      return css.includes('touch-target') && 
             css.includes('safe-area-inset') && 
             css.includes('prefers-reduced-motion')
    },
    description: 'CSS optimizations for mobile devices and accessibility'
  },
  {
    name: 'Next.js Mobile Config',
    check: () => {
      const configPath = join(process.cwd(), 'next.config.ts')
      if (!existsSync(configPath)) return false
      
      const config = readFileSync(configPath, 'utf-8')
      return config.includes('images') && 
             config.includes('deviceSizes') && 
             config.includes('formats')
    },
    description: 'Next.js configuration for image optimization and mobile performance'
  },
  {
    name: 'Mobile Layout Optimizations',
    check: () => {
      const layoutPath = join(process.cwd(), 'app/layout.tsx')
      if (!existsSync(layoutPath)) return false
      
      const layout = readFileSync(layoutPath, 'utf-8')
      return layout.includes('viewport') && 
             layout.includes('apple-mobile-web-app') && 
             layout.includes('OfflineIndicator')
    },
    description: 'Root layout optimized for mobile devices'
  },
  {
    name: 'Touch-Friendly Navigation',
    check: () => {
      const headerPath = join(process.cwd(), 'components/layout/header.tsx')
      if (!existsSync(headerPath)) return false
      
      const header = readFileSync(headerPath, 'utf-8')
      return header.includes('MobileNavigation') && 
             header.includes('touch-target') && 
             header.includes('useMobile')
    },
    description: 'Navigation components optimized for touch interfaces'
  },
  {
    name: 'Mobile Form Optimizations',
    check: () => {
      const formPath = join(process.cwd(), 'components/forms/donor-registration-form.tsx')
      if (!existsSync(formPath)) return false
      
      const form = readFileSync(formPath, 'utf-8')
      return form.includes('MobileInput') && 
             form.includes('MobileButton') && 
             form.includes('useMobile')
    },
    description: 'Forms optimized for mobile input and touch interaction'
  },
  {
    name: 'Performance Monitoring',
    check: () => {
      const perfPath = join(process.cwd(), 'components/ui/performance-monitor.tsx')
      if (!existsSync(perfPath)) return false
      
      const perf = readFileSync(perfPath, 'utf-8')
      return perf.includes('PerformanceObserver') && 
             perf.includes('getBatteryStatus') && 
             perf.includes('isSlowConnection')
    },
    description: 'Performance monitoring for mobile optimization'
  }
]

function runChecks() {
  console.log('🔍 Verifying Mobile Optimizations...\n')
  
  let passed = 0
  let failed = 0
  
  checks.forEach((check, index) => {
    try {
      const result = check.check()
      const status = result ? '✅ PASS' : '❌ FAIL'
      const number = `${index + 1}`.padStart(2, '0')
      
      console.log(`${number}. ${status} ${check.name}`)
      console.log(`    ${check.description}`)
      
      if (result) {
        passed++
      } else {
        failed++
        console.log(`    ⚠️  Check failed - please verify implementation`)
      }
      
      console.log('')
    } catch (error) {
      console.log(`${index + 1}. ❌ ERROR ${check.name}`)
      console.log(`    Error: ${error}`)
      console.log('')
      failed++
    }
  })
  
  console.log('📊 Summary:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / checks.length) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All mobile optimizations are properly implemented!')
  } else {
    console.log('\n⚠️  Some optimizations need attention. Please review the failed checks.')
  }
  
  return failed === 0
}

// Additional checks for mobile-specific features
function checkMobileFeatures() {
  console.log('\n🔧 Checking Mobile-Specific Features...\n')
  
  const features = [
    {
      name: 'Touch Target Sizing',
      description: 'Minimum 44px touch targets for accessibility',
      check: () => {
        const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf-8')
        return css.includes('min-height: 44px') || css.includes('touch-target')
      }
    },
    {
      name: 'Haptic Feedback',
      description: 'Vibration API integration for touch feedback',
      check: () => {
        const utils = readFileSync(join(process.cwd(), 'lib/mobile-utils.ts'), 'utf-8')
        return utils.includes('triggerHapticFeedback') && utils.includes('navigator.vibrate')
      }
    },
    {
      name: 'Offline Support',
      description: 'Offline detection and user feedback',
      check: () => {
        const offline = readFileSync(join(process.cwd(), 'components/ui/offline-indicator.tsx'), 'utf-8')
        return offline.includes('navigator.onLine') && offline.includes('useNetworkStatus')
      }
    },
    {
      name: 'Pull-to-Refresh',
      description: 'Native mobile gesture support',
      check: () => {
        const ptr = readFileSync(join(process.cwd(), 'components/ui/pull-to-refresh.tsx'), 'utf-8')
        return ptr.includes('touchstart') && ptr.includes('touchmove') && ptr.includes('touchend')
      }
    },
    {
      name: 'Responsive Images',
      description: 'Optimized image loading for mobile',
      check: () => {
        const img = readFileSync(join(process.cwd(), 'components/ui/optimized-image.tsx'), 'utf-8')
        return img.includes('sizes') && img.includes('quality') && img.includes('loading')
      }
    }
  ]
  
  features.forEach((feature, index) => {
    try {
      const result = feature.check()
      const status = result ? '✅' : '❌'
      console.log(`${status} ${feature.name}: ${feature.description}`)
    } catch (error) {
      console.log(`❌ ${feature.name}: Error checking feature`)
    }
  })
}

// Run all checks
if (require.main === module) {
  const success = runChecks()
  checkMobileFeatures()
  
  process.exit(success ? 0 : 1)
}

export { runChecks, checkMobileFeatures }