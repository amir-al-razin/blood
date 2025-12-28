import { MemberAuthProvider } from '@/components/auth/member-auth-context'
import { Toaster } from 'sonner'

export default function MemberLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <MemberAuthProvider>
            {children}
            <Toaster position="top-right" richColors />
        </MemberAuthProvider>
    )
}
