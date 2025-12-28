'use client'

import { useTranslations } from '@/lib/i18n'
import { Heart, Users, Target, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PublicLayout } from '@/components/layout/public-layout'

export default function AboutPage() {
  const t = useTranslations('about')

  const values = [
    {
      icon: Heart,
      titleKey: 'values.compassion.title',
      descriptionKey: 'values.compassion.description'
    },
    {
      icon: Users,
      titleKey: 'values.community.title',
      descriptionKey: 'values.community.description'
    },
    {
      icon: Target,
      titleKey: 'values.efficiency.title',
      descriptionKey: 'values.efficiency.description'
    },
    {
      icon: Globe,
      titleKey: 'values.accessibility.title',
      descriptionKey: 'values.accessibility.description'
    }
  ]

  const milestones = [
    {
      year: '2024',
      titleKey: 'milestones.2024.title',
      descriptionKey: 'milestones.2024.description'
    },
    {
      year: '2024',
      titleKey: 'milestones.launch.title',
      descriptionKey: 'milestones.launch.description'
    }
  ]

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mission */}
              <Card className="border-l-4 border-l-red-600">
                <CardHeader>
                  <CardTitle className="text-2xl text-red-600">
                    {t('mission.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {t('mission.description')}
                  </p>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="border-l-4 border-l-blue-600">
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-600">
                    {t('vision.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {t('vision.description')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              {t('values.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full">
                          <Icon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t(value.titleKey)}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t(value.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-red-600 text-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">
              {t('impact.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <p className="text-red-100">{t('impact.donors')}</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5,000+</div>
                <p className="text-red-100">{t('impact.recipients')}</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">15,000+</div>
                <p className="text-red-100">{t('impact.lives')}</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50+</div>
                <p className="text-red-100">{t('impact.hospitals')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              {t('story.title')}
            </h2>
            <div className="prose prose-lg text-gray-700 space-y-4">
              <p>{t('story.paragraph1')}</p>
              <p>{t('story.paragraph2')}</p>
              <p>{t('story.paragraph3')}</p>
            </div>
          </div>
        </section>

        {/* Timeline/Milestones */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              {t('milestones.title')}
            </h2>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="w-1 h-16 bg-red-200 my-2" />
                    )}
                  </div>
                  <Card className="flex-1 mb-4">
                    <CardHeader>
                      <div className="text-sm text-red-600 font-semibold mb-2">
                        {milestone.year}
                      </div>
                      <CardTitle>{t(milestone.titleKey)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        {t(milestone.descriptionKey)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-red-700 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-red-100 mb-8">
              {t('cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/donate"
                className="px-8 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors"
              >
                {t('cta.becomeDonor')}
              </a>
              <a
                href="/request"
                className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                {t('cta.requestBlood')}
              </a>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
