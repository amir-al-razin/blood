import { auth } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await auth()

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium">{session.user.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium">{session.user.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Role</div>
              <div className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                {session.user.role?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon placeholder */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-gray-500">
          <p>Additional settings and admin features coming soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}