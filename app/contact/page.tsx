'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from '@/lib/i18n'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PublicLayout } from '@/components/layout/public-layout'

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters')
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const t = useTranslations('contact')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema)
  })

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setSubmitStatus('success')
        reset()
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactMethods = [
    {
      icon: Mail,
      titleKey: 'methods.email.title',
      descriptionKey: 'methods.email.description',
      value: 'info@redaid.com'
    },
    {
      icon: Phone,
      titleKey: 'methods.phone.title',
      descriptionKey: 'methods.phone.description',
      value: '+880-1712-345-678'
    },
    {
      icon: MapPin,
      titleKey: 'methods.address.title',
      descriptionKey: 'methods.address.description',
      value: 'Dhaka, Bangladesh'
    },
    {
      icon: Clock,
      titleKey: 'methods.hours.title',
      descriptionKey: 'methods.hours.description',
      value: '24/7 Available'
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
            <p className="text-xl text-gray-600">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {contactMethods.map((method, index) => {
                const Icon = method.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-center mb-4">
                        <div className="bg-red-100 p-3 rounded-full">
                          <Icon className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t(method.titleKey)}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {t(method.descriptionKey)}
                      </p>
                      <p className="text-red-600 font-semibold">
                        {method.value}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Contact Form & Map */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('form.title')}
                </h2>

                {submitStatus === 'success' && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">
                      {t('form.successMessage')}
                    </AlertDescription>
                  </Alert>
                )}

                {submitStatus === 'error' && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>
                      {t('form.errorMessage')}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.name')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('form.namePlaceholder')}
                      {...register('name')}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.email')}
                    </label>
                    <Input
                      type="email"
                      placeholder={t('form.emailPlaceholder')}
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.phone')}
                    </label>
                    <Input
                      type="tel"
                      placeholder={t('form.phonePlaceholder')}
                      {...register('phone')}
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.subject')}
                    </label>
                    <Input
                      type="text"
                      placeholder={t('form.subjectPlaceholder')}
                      {...register('subject')}
                      className={errors.subject ? 'border-red-500' : ''}
                    />
                    {errors.subject && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('form.message')}
                    </label>
                    <textarea
                      placeholder={t('form.messagePlaceholder')}
                      rows={5}
                      {...register('message')}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        errors.message ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.message && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2"
                  >
                    {isSubmitting ? t('form.sending') : t('form.send')}
                  </Button>
                </form>
              </div>

              {/* Information Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('info.title')}
                </h2>

                <div className="space-y-6">
                  {/* Business Hours */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('info.hours.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-gray-600">
                      <p>
                        <span className="font-semibold">{t('info.hours.weekdays')}:</span> {t('info.hours.weekdaysTime')}
                      </p>
                      <p>
                        <span className="font-semibold">{t('info.hours.weekends')}:</span> {t('info.hours.weekendTime')}
                      </p>
                      <p className="text-sm text-red-600 font-semibold">
                        {t('info.hours.emergency')}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Response Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('info.response.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600">
                      <p>{t('info.response.description')}</p>
                    </CardContent>
                  </Card>

                  {/* Follow Us */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {t('info.social.title')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4">
                        <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
                          Facebook
                        </a>
                        <a href="#" className="text-sky-500 hover:text-sky-700 font-semibold">
                          Twitter
                        </a>
                        <a href="#" className="text-pink-600 hover:text-pink-800 font-semibold">
                          Instagram
                        </a>
                        <a href="#" className="text-red-600 hover:text-red-800 font-semibold">
                          LinkedIn
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              {t('faq.title')}
            </h2>

            <div className="space-y-4">
              {[1, 2, 3, 4].map((index) => (
                <details key={index} className="group border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors">
                  <summary className="flex items-center justify-between font-semibold text-gray-900">
                    <span>{t(`faq.q${index}.question`)}</span>
                    <span className="transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {t(`faq.q${index}.answer`)}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}
