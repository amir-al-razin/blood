import { PublicLayout } from '@/components/layout/public-layout'
import { DonorRegistrationForm } from '@/components/forms/donor-registration-form'

export default function DonatePage() {
  return (
    <PublicLayout>
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Become a Blood Donor
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join our community of life-savers. Register as a blood donor and 
              help save lives in your community.
            </p>
          </div>

          {/* Form */}
          <DonorRegistrationForm />
        </div>
      </div>
    </PublicLayout>
  )
}