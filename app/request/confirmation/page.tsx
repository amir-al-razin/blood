import { Suspense } from 'react'
import { PublicLayout } from '@/components/layout/public-layout'
import { ConfirmationContent } from '@/components/request/confirmation-content'

export default function ConfirmationPage() {
  return (
    <PublicLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <ConfirmationContent />
      </Suspense>
    </PublicLayout>
  )
}