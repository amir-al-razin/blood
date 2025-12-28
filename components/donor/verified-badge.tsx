'use client'

import { CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface VerifiedBadgeProps {
    showLabel?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function VerifiedBadge({ showLabel = true, size = 'md' }: VerifiedBadgeProps) {
    const sizeClasses = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5'
    }

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }

    return (
        <Badge
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 gap-1"
        >
            <CheckCircle className={sizeClasses[size]} />
            {showLabel && <span className={textSizes[size]}>Verified Donor</span>}
        </Badge>
    )
}
