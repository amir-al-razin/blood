'use client'

import { PullToRefresh } from '@/components/ui/pull-to-refresh'

interface HomeContentProps {
  children: React.ReactNode
}

export function HomeContent({ children }: HomeContentProps) {
  const handleRefresh = async () => {
    // Simulate refresh - in real app, this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000))
    window.location.reload()
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      {children}
    </PullToRefresh>
  )
}