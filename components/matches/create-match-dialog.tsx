'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateMatchDialogProps {
  children: React.ReactNode
}

export function CreateMatchDialog({ children }: CreateMatchDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
          <DialogDescription>
            Match a donor with a blood request. This feature will be implemented in the next phase.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="text-center text-muted-foreground">
            <p>The match creation interface will include:</p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
              <li>• Select pending blood request</li>
              <li>• Search compatible donors by blood type and location</li>
              <li>• Check donor availability and eligibility</li>
              <li>• Create match and send notifications</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}