'use client'

import { Star, Quote } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export function TestimonialsSection() {
  const t = useTranslations('pages')

  const testimonials = [
    {
      name: 'Dr. Sarah Ahmed',
      role: 'Emergency Physician',
      hospital: 'Dhaka Medical College',
      content: 'RedAid has revolutionized how we handle emergency blood requests. The platform is incredibly fast and reliable, helping us save precious time when every minute counts.',
      rating: 5,
      image: '/api/placeholder/64/64'
    },
    {
      name: 'Ahmed Rahman',
      role: 'Regular Donor',
      location: 'Dhanmondi, Dhaka',
      content: 'I\'ve been donating blood for years, but RedAid makes it so much easier. The privacy protection and professional coordination give me confidence in the process.',
      rating: 5,
      image: '/api/placeholder/64/64'
    },
    {
      name: 'Fatima Khatun',
      role: 'Patient Family',
      location: 'Gulshan, Dhaka',
      content: 'When my father needed urgent blood during surgery, RedAid connected us with donors within hours. The platform literally saved his life. Forever grateful!',
      rating: 5,
      image: '/api/placeholder/64/64'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t('home.testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('home.testimonials.description')}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-red-200" />
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="bg-red-100 rounded-full p-3 mr-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-gray-500">
                    {testimonial.hospital || testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Stories CTA */}
        <div className="mt-12 text-center">
          <div className="bg-red-600 text-white rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              {t('home.testimonials.ctaTitle')}
            </h3>
            <p className="text-red-100 mb-6">
              {t('home.testimonials.ctaDescription')}
            </p>
            <button className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition-colors">
              {t('home.testimonials.shareStory')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}