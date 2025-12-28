'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMemberAuth } from '@/components/auth/member-auth-context'

interface SmartCTAButtonProps {
    intent: 'request-blood' | 'become-donor'
    children: React.ReactNode
    size?: 'default' | 'sm' | 'lg' | 'icon'
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    className?: string
}

export function SmartCTAButton({ intent, children, size, variant, className }: SmartCTAButtonProps) {
    const router = useRouter()
    const { member, loading } = useMemberAuth()

    const handleClick = () => {
        if (loading) return // Wait for auth check

        if (member) {
            // User is logged in, go directly to the action page
            if (intent === 'request-blood') {
                router.push('/member/request-blood')
            } else if (intent === 'become-donor') {
                router.push('/member/donor/apply')
            }
        } else {
            // User is not logged in, go to login with intent
            router.push(`/member/login?intent=${intent}`)
        }
    }

    return (
        <Button
            onClick={handleClick}
            disabled={loading}
            size={size}
            variant={variant}
            className={className}
        >
            {children}
        </Button>
    )
}
