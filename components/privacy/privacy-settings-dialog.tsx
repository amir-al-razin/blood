'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

interface PrivacySettings {
  allowSMSNotifications: boolean
  allowEmailNotifications: boolean
  allowPhoneCalls: boolean
  shareLocationWithRequests: boolean
  shareStatisticsAnonymously: boolean
  allowResearchParticipation: boolean
  hideFromPublicStats: boolean
  anonymizeInReports: boolean
}

interface PrivacySettingsDialogProps {
  donorId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function PrivacySettingsDialog({
  donorId,
  isOpen,
  onClose,
  onUpdate
}: PrivacySettingsDialogProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    allowSMSNotifications: true,
    allowEmailNotifications: true,
    allowPhoneCalls: false,
    shareLocationWithRequests: true,
    shareStatisticsAnonymously: true,
    allowResearchParticipation: false,
    hideFromPublicStats: false,
    anonymizeInReports: false
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && donorId) {
      fetchPrivacySettings()
    }
  }, [isOpen, donorId])

  const fetchPrivacySettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/privacy/settings?donorId=${donorId}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        toast.error('Failed to load privacy settings')
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error)
      toast.error('Failed to load privacy settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          donorId,
          settings
        })
      })

      if (response.ok) {
        toast.success('Privacy settings updated successfully')
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update privacy settings')
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
          <DialogDescription>
            Manage how this donor's information is used and shared.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Communication Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Communication Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowSMSNotifications"
                    checked={settings.allowSMSNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('allowSMSNotifications', checked as boolean)
                    }
                  />
                  <Label htmlFor="allowSMSNotifications">
                    Allow SMS notifications for donation requests
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowEmailNotifications"
                    checked={settings.allowEmailNotifications}
                    onCheckedChange={(checked) => 
                      updateSetting('allowEmailNotifications', checked as boolean)
                    }
                  />
                  <Label htmlFor="allowEmailNotifications">
                    Allow email notifications for donation requests
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowPhoneCalls"
                    checked={settings.allowPhoneCalls}
                    onCheckedChange={(checked) => 
                      updateSetting('allowPhoneCalls', checked as boolean)
                    }
                  />
                  <Label htmlFor="allowPhoneCalls">
                    Allow phone calls for urgent donation requests
                  </Label>
                </div>
              </div>
            </div>

            {/* Data Sharing Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Data Sharing Preferences</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareLocationWithRequests"
                    checked={settings.shareLocationWithRequests}
                    onCheckedChange={(checked) => 
                      updateSetting('shareLocationWithRequests', checked as boolean)
                    }
                  />
                  <Label htmlFor="shareLocationWithRequests">
                    Share location information for matching with requests
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shareStatisticsAnonymously"
                    checked={settings.shareStatisticsAnonymously}
                    onCheckedChange={(checked) => 
                      updateSetting('shareStatisticsAnonymously', checked as boolean)
                    }
                  />
                  <Label htmlFor="shareStatisticsAnonymously">
                    Include in anonymous platform statistics
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowResearchParticipation"
                    checked={settings.allowResearchParticipation}
                    onCheckedChange={(checked) => 
                      updateSetting('allowResearchParticipation', checked as boolean)
                    }
                  />
                  <Label htmlFor="allowResearchParticipation">
                    Allow anonymized data to be used for research purposes
                  </Label>
                </div>
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Visibility Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hideFromPublicStats"
                    checked={settings.hideFromPublicStats}
                    onCheckedChange={(checked) => 
                      updateSetting('hideFromPublicStats', checked as boolean)
                    }
                  />
                  <Label htmlFor="hideFromPublicStats">
                    Hide from public statistics and donor counts
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymizeInReports"
                    checked={settings.anonymizeInReports}
                    onCheckedChange={(checked) => 
                      updateSetting('anonymizeInReports', checked as boolean)
                    }
                  />
                  <Label htmlFor="anonymizeInReports">
                    Anonymize personal information in exported reports
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}