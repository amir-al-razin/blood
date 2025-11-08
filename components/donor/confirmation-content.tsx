'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Phone, Mail, Clock, Heart, Shield, Users } from 'lucide-react'

export function DonorConfirmationContent() {
  const searchParams = useSearchParams()
  const donorId = searchParams.get('id')

  if (!donorId) {
    return (
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600">Invalid confirmation link.</p>
              <Button asChild className="mt-4">
                <Link href="/donate">Register as Donor</Link>
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
              Registration Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Welcome to the RedAid donor community! Your registration has been submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-red-50 p-6 rounded-lg mb-6">
              <Heart className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Thank You for Joining Our Mission
              </h3>
              <p className="text-gray-700">
                You're now part of a community of heroes who save lives through blood donation. 
                Your generosity can make the difference between life and death for someone in need.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What Happens Next */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              What Happens Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Profile Verification</h4>
                  <p className="text-gray-600 text-sm">
                    Our medical team will review and verify your registration within 24-48 hours.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Activation Notification</h4>
                  <p className="text-gray-600 text-sm">
                    You'll receive an SMS and email confirmation once your profile is activated.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Donation Requests</h4>
                  <p className="text-gray-600 text-sm">
                    When your blood type is needed, we'll contact you with donation opportunities.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-1">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Save Lives</h4>
                  <p className="text-gray-600 text-sm">
                    Participate in blood donations and help save lives in your community.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5 text-red-600" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Privacy & Security</h4>
                <p className="text-sm text-gray-700">
                  Your contact information is kept strictly confidential and will only be 
                  shared with verified medical staff when coordinating donations.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Donation Guidelines</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Males can donate every 90 days</li>
                  <li>• Females can donate every 120 days</li>
                  <li>• Always maintain good health and nutrition</li>
                  <li>• Inform us of any health changes</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Availability Status</h4>
                <p className="text-sm text-gray-700">
                  You can update your availability status anytime by contacting us. 
                  We respect your schedule and will only contact you when you're available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-red-600" />
              Stay Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Phone className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Emergency Hotline</div>
                <div className="text-red-600 font-bold">+880 1700-000000</div>
                <div className="text-sm text-gray-600">24/7 Available</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <Mail className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="font-semibold text-gray-900">Email Support</div>
                <div className="text-red-600 font-bold">donors@redaid.com</div>
                <div className="text-sm text-gray-600">General inquiries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-red-600" />
              Join Our Community
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-600">1,247</div>
                <div className="text-sm text-gray-600">Active Donors</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">3,891</div>
                <div className="text-sm text-gray-600">Lives Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">64</div>
                <div className="text-sm text-gray-600">Areas Covered</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1 bg-red-600 hover:bg-red-700">
            <Link href="/">
              <Heart className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/about">
              Learn More About RedAid
            </Link>
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            You will receive updates about your verification status and donation opportunities.
            <br />
            <strong>Verification time:</strong> 24-48 hours
          </p>
        </div>
      </div>
    </div>
  )
}