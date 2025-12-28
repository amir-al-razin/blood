'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Phone, Mail, Clock, Heart } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

export function ConfirmationContent() {
  const t = useTranslations('confirmation')
  const tCommon = useTranslations('common')
  const searchParams = useSearchParams()
  const referenceId = searchParams.get('ref')

  if (!referenceId) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">{t('invalidLink')}</p>
              <Button asChild className="mt-4">
                <Link href="/request">{t('backRequest')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              {t('success')}!
            </CardTitle>
            <CardDescription className="text-lg">
              {t('successMessage')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Reference ID:</p>
              <p className="text-2xl font-bold text-gray-900 font-mono">
                {referenceId}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please save this reference ID for future communication
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              {t('nextSteps')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Immediate Processing</h4>
                  <p className="text-gray-600 text-sm">
                    Our system is now searching for matching donors in your area based on blood type and location.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Admin Review</h4>
                  <p className="text-gray-600 text-sm">
                    Our medical team will review your request and verify the details within 30 minutes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Donor Contact</h4>
                  <p className="text-gray-600 text-sm">
                    We'll contact suitable donors and coordinate the donation process with you.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Donation Coordination</h4>
                  <p className="text-gray-600 text-sm">
                    We'll help coordinate the time and location for the blood donation.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-red-600" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-gray-700 mb-3">
                For urgent requests or if you need immediate assistance:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">+880 1700-000000</span>
                  <span className="text-sm text-gray-600">(24/7 Hotline)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-red-600" />
                  <span className="font-semibold">emergency@redaid.com</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <Link href="/">
              <Heart className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/request">
              Submit Another Request
            </Link>
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            You will receive SMS and email updates about your request status.
            <br />
            Expected response time: <strong>2-24 hours</strong> depending on urgency level.
          </p>
        </div>
      </div>
    </div>
  )
}