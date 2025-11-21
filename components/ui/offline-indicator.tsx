'use client'

import { useNetworkStatus } from '@/hooks/use-mobile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfflineIndicatorProps {
  className?: string
  showConnectionType?: boolean
}

export function OfflineIndicator({ className, showConnectionType = false }: OfflineIndicatorProps) {
  const { isOnline, isOffline, connectionType, isSlowConnection } = useNetworkStatus()

  const handleRetry = () => {
    window.location.reload()
  }

  if (isOnline && !isSlowConnection) {
    return null
  }

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50', className)}>
      {isOffline && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're offline. Some features may not work.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="ml-2 h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isOnline && isSlowConnection && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="flex items-center justify-between">
              <span>Slow connection detected. Loading may take longer.</span>
              {showConnectionType && (
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                  {connectionType.toUpperCase()}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// Connection status indicator for the UI
export function ConnectionStatus({ className }: { className?: string }) {
  const { isOnline, connectionType } = useNetworkStatus()

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {isOnline && connectionType !== 'unknown' && (
        <span className="text-gray-500">({connectionType})</span>
      )}
    </div>
  )
}