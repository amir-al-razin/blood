import { Metadata } from 'next'
import { PrivacyManagement } from '@/components/privacy/privacy-management'

export const metadata: Metadata = {
  title: 'Privacy Management | RedAid Dashboard',
  description: 'Manage privacy settings, data protection, and audit trails'
}

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy Management</h1>
        <p className="text-muted-foreground">
          Manage data protection, privacy settings, and audit trails for donor information.
        </p>
      </div>

      <PrivacyManagement />
    </div>
  )
}