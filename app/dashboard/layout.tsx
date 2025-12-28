import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { db } from '@/lib/db'

// Get admin user from session cookie
async function getAdminSession() {
  const cookieStore = await cookies()
  const adminSessionCookie = cookieStore.get('admin_session')

  if (!adminSessionCookie?.value) {
    return null
  }

  try {
    // Decode base64 cookie value
    const decoded = atob(adminSessionCookie.value)
    const { userId, role } = JSON.parse(decoded)

    // Look up user in database to get full details
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) return null

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    console.error('Error reading admin session:', error)
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar user={session.user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader user={session.user} />
        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-padding">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}