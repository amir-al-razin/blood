'use client'

import { Button } from '@/components/ui/button'
import { Heart, Users, Clock, Shield } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'
import { SmartCTAButton } from './smart-cta-button'

export function HeroSection() {
  const t = useTranslations('pages')
  const tCommon = useTranslations('common')

  return (
    <section className="bg-gradient-to-br from-red-50 to-white py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {t('home.heroTitle')}
              <span className="text-red-600 block">{t('home.becomeDonor')}</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              {t('home.heroDescription')}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <SmartCTAButton
                intent="request-blood"
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-lg px-8 py-4"
              >
                <Heart className="mr-2 h-5 w-5" />
                {t('home.findDonor')}
              </SmartCTAButton>
              <SmartCTAButton
                intent="become-donor"
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4"
              >
                {t('home.becomeDonor')}
              </SmartCTAButton>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{t('home.stats.donors')}</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <Clock className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">24/7 {tCommon('available')}</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{tCommon('private')}</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-2">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{t('home.stats.lives')}</p>
              </div>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative">
            <div className="bg-gradient-to-br from-red-100 to-red-50 rounded-2xl p-8 lg:p-12">
              <div className="text-center">
                <div className="bg-red-600 p-8 rounded-full w-fit mx-auto mb-6">
                  <Heart className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {t('home.stats.matches')}
                </h3>
                <p className="text-gray-600">
                  {t('home.subtitle')}
                </p>

                {/* Floating Stats */}
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-red-600">1,247</div>
                    <div className="text-sm text-gray-600">{t('home.stats.donors')}</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-red-600">3,891</div>
                    <div className="text-sm text-gray-600">{t('home.stats.lives')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}