import { PublicLayout } from '@/components/layout/public-layout'
import { HeroSection } from '@/components/home/hero-section'
import { StatsSection } from '@/components/home/stats-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { CTASection } from '@/components/home/cta-section'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'
import { HomeContent } from '@/components/home/home-content'

export default function Home() {
  return (
    <PublicLayout>
      <PerformanceMonitor enableLogging={process.env.NODE_ENV === 'development'} />
      <HomeContent>
        <HeroSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </HomeContent>
    </PublicLayout>
  )
}