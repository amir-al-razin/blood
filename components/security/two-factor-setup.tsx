'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Smartphone, 
  Key, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  QrCode
} from 'lucide-react'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  userId: string
  isEnabled: boolean
  onStatusChange: (enabled: boolean) => void
}

export function TwoFactorSetup({ userId, isEnabled, onStatusChange }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setup2FA = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to setup 2FA')
      }

      const data = await response.json()
      setQrCodeUrl(data.qrCodeUrl)
      setSecret(data.secret)
      setBackupCodes(data.backupCodes)
      setStep('verify')
    } catch (error) {
      setError('Failed to setup two-factor authentication')
      console.error('2FA setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: verificationCode
        })
      })

      if (!response.ok) {
        throw new Error('Invalid verification code')
      }

      setStep('backup')
      toast.success('Two-factor authentication enabled successfully!')
      onStatusChange(true)
    } catch (error) {
      setError('Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    const password = prompt('Please enter your password to disable 2FA:')
    if (!password) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })

      if (!response.ok) {
        throw new Error('Failed to disable 2FA')
      }

      toast.success('Two-factor authentication disabled')
      onStatusChange(false)
    } catch (error) {
      setError('Failed to disable two-factor authentication')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const downloadBackupCodes = () => {
    const content = `RedAid Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'redaid-2fa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Your account is protected with two-factor authentication
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication is active on your account. You'll need your authenticator app or backup codes to sign in.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={disable2FA} disabled={loading}>
              Disable 2FA
            </Button>
            <Button variant="outline" onClick={() => setStep('backup')}>
              View Backup Codes
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'setup' && (
          <div className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication adds an extra layer of security to your account. 
                You'll need an authenticator app like Google Authenticator or Authy.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium">What you'll need:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• An authenticator app on your phone</li>
                <li>• Access to scan a QR code or enter a setup key</li>
                <li>• A secure place to store backup codes</li>
              </ul>
            </div>

            <Button onClick={setup2FA} disabled={loading} className="w-full">
              {loading ? 'Setting up...' : 'Setup Two-Factor Authentication'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'verify' && (
          <Tabs defaultValue="qr" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">Scan QR Code</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="border rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Scan this QR code with your authenticator app
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>Setup Key</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono text-sm" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Enter this key manually in your authenticator app
                </p>
              </div>
            </TabsContent>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                />
                <p className="text-sm text-gray-600">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button onClick={verify2FA} disabled={loading || verificationCode.length !== 6} className="w-full">
                {loading ? 'Verifying...' : 'Verify and Enable'}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </Tabs>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Save these backup codes in a secure location. 
                Each code can only be used once and will allow you to access your account if you lose your phone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <Button variant="outline" size="sm" onClick={downloadBackupCodes}>
                  Download Codes
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                {backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm p-2 bg-white rounded border">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Make sure to save these codes before closing this dialog. You won't be able to see them again.
              </AlertDescription>
            </Alert>

            <Button onClick={() => setStep('setup')} className="w-full">
              I've Saved My Backup Codes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}