import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Eye, Trash2, FileText, Phone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | RedAid',
  description: 'Learn how RedAid protects your personal information and respects your privacy'
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy is our priority. Learn how we protect your personal information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} | Version 1.0
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                RedAid is committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, protect, and share your information when you use our 
                blood donation platform.
              </p>
              <p>
                We understand that blood donation involves sensitive medical and personal information, and we have 
                implemented comprehensive privacy controls to ensure your data is handled with the utmost care and security.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Name, phone number, and email address</li>
                  <li>Date of birth, gender, and weight</li>
                  <li>Blood type and medical eligibility information</li>
                  <li>Location and address information</li>
                  <li>Donation history and availability status</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Medical Information</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Health conditions and medications (if disclosed)</li>
                  <li>Previous donation dates and eligibility status</li>
                  <li>Medical documents uploaded for verification</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Platform usage patterns and preferences</li>
                  <li>Communication preferences and consent records</li>
                  <li>Device information and IP addresses (for security)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Primary Uses</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Matching donors with blood requests based on compatibility</li>
                  <li>Contacting you about donation opportunities</li>
                  <li>Verifying your identity and eligibility to donate</li>
                  <li>Maintaining donation records and history</li>
                  <li>Providing platform services and support</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Secondary Uses (with consent)</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Anonymous statistics and platform improvement</li>
                  <li>Research purposes (anonymized data only)</li>
                  <li>Public health initiatives and awareness campaigns</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Privacy Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Communication Preferences</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Control how we contact you (SMS, email, phone calls)</li>
                  <li>Opt out of non-essential communications</li>
                  <li>Set availability status and donation preferences</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Sharing Controls</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Control whether your location is shared for matching</li>
                  <li>Opt in/out of anonymous statistics and research</li>
                  <li>Hide your profile from public donor counts</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Access Controls</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Contact information is only accessible to verified staff</li>
                  <li>All access to sensitive data is logged and audited</li>
                  <li>Staff must provide justification for accessing contact details</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Technical Safeguards</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>All data is encrypted in transit and at rest</li>
                  <li>Secure HTTPS connections for all communications</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Multi-factor authentication for staff accounts</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Administrative Safeguards</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Role-based access controls for different staff levels</li>
                  <li>Comprehensive audit logging of all data access</li>
                  <li>Regular staff training on privacy and security</li>
                  <li>Incident response procedures for data breaches</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Data Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Who We Share With</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Medical Staff:</strong> Verified healthcare professionals for donation coordination</li>
                  <li><strong>Blood Requesters:</strong> Limited information for successful matches only</li>
                  <li><strong>Service Providers:</strong> Trusted partners for SMS, email, and hosting services</li>
                  <li><strong>Legal Authorities:</strong> When required by law or to protect safety</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">What We Don't Share</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>We never sell your personal information to third parties</li>
                  <li>Contact details are not shared with other donors or the public</li>
                  <li>Medical information is kept strictly confidential</li>
                  <li>Location data is only used for matching purposes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Data Rights</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain uses of your data</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Data Retention</h3>
                <p className="text-gray-700">
                  We retain your personal information for 5 years after your last donation or account activity. 
                  Donation history may be anonymized and retained longer for medical and statistical purposes. 
                  You can request earlier deletion of your data at any time.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>
                Questions about this privacy policy or your data rights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data rights, 
                please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <p><strong>Email:</strong> privacy@redaid.org</p>
                  <p><strong>Phone:</strong> +880 1700-000000</p>
                  <p><strong>Address:</strong> RedAid Privacy Office, Dhaka, Bangladesh</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                We will respond to your privacy requests within 30 days. For urgent matters related to 
                data security or unauthorized access, please contact us immediately.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}