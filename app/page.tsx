import { PublicLayout } from '@/components/layout/public-layout'
import { HeroSection } from '@/components/home/hero-section'
import { StatsSection } from '@/components/home/stats-section'
import { TestimonialsSection } from '@/components/home/testimonials-section'
import { CTASection } from '@/components/home/cta-section'

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
    </PublicLayout>
  )
}