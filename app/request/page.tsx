import { PublicLayout } from '@/components/layout/public-layout'
import { BloodRequestForm } from '@/components/forms/blood-request-form'

export default function RequestPage() {
  return (
    <PublicLayout>
      <div className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Request Blood
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fill out the form below to request blood. Our team will immediately 
              start searching for matching donors in your area.
            </p>
          </div>

          {/* Form */}
          <BloodRequestForm />
        </div>
      </div>
    </PublicLayout>
  )
}