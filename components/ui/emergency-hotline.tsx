'use client'

import { Phone, AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/lib/i18n'

interface EmergencyHotlineProps {
    variant?: 'banner' | 'inline' | 'compact'
    className?: string
}

export function EmergencyHotline({ variant = 'banner', className = '' }: EmergencyHotlineProps) {
    const t = useTranslations('common')

    // TODO: Make this configurable through admin panel
    const hotlineNumber = '+880 1700-000000'

    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-2 text-sm ${className}`}>
                <Phone className="h-4 w-4 text-red-600" />
                <span className="text-gray-600">Emergency:</span>
                <a
                    href={`tel:${hotlineNumber.replace(/\s/g, '')}`}
                    className="font-semibold text-red-600 hover:text-red-700"
                >
                    {hotlineNumber}
                </a>
            </div>
        )
    }

    if (variant === 'inline') {
        return (
            <div className={`bg-red-50 border border-red-100 rounded-lg p-4 ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full">
                        <Phone className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-900">
                            {t('emergency')} Hotline
                        </p>
                        <a
                            href={`tel:${hotlineNumber.replace(/\s/g, '')}`}
                            className="text-lg font-bold text-red-600 hover:text-red-700"
                        >
                            {hotlineNumber}
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    // Default: banner variant
    return (
        <div className={`bg-gradient-to-r from-red-600 to-red-700 text-white ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                        <span className="font-medium">{t('emergency')}?</span>
                    </div>
                    <span className="text-red-100">
                        Call our 24/7 hotline for immediate assistance
                    </span>
                    <a
                        href={`tel:${hotlineNumber.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 bg-white text-red-600 px-4 py-1.5 rounded-full font-bold hover:bg-red-50 transition-colors"
                    >
                        <Phone className="h-4 w-4" />
                        {hotlineNumber}
                    </a>
                </div>
            </div>
        </div>
    )
}
