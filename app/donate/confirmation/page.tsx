import { Suspense } from 'react'
import { PublicLayout } from '@/components/layout/public-layout'
import { DonorConfirmationContent } from '@/components/donor/confirmation-content'

export default function DonorConfirmationPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <DonorConfirmationContent />
      </Suspense>
    </PublicLayout>
  )
}