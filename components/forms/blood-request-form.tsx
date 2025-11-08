'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const bloodRequestSchema = z.object({
  requesterName: z.string().min(2, 'Name must be at least 2 characters'),
  requesterPhone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number'),
  requesterEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  location: z.string().min(1, 'Please select a location'),
  hospital: z.string().min(2, 'Hospital name is required'),
  urgencyLevel: z.enum(['CRITICAL', 'URGENT', 'NORMAL']),
  unitsRequired: z.number().min(1, 'At least 1 unit is required').max(10, 'Maximum 10 units allowed'),
  notes: z.string().optional()
})

type BloodRequestForm = z.infer<typeof bloodRequestSchema>

const bloodTypes = [
  { value: 'A_POSITIVE', label: 'A+' },
  { value: 'A_NEGATIVE', label: 'A-' },
  { value: 'B_POSITIVE', label: 'B+' },
  { value: 'B_NEGATIVE', label: 'B-' },
  { value: 'AB_POSITIVE', label: 'AB+' },
  { value: 'AB_NEGATIVE', label: 'AB-' },
  { value: 'O_POSITIVE', label: 'O+' },
  { value: 'O_NEGATIVE', label: 'O-' }
]

const locations = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'
]

const urgencyLevels = [
  { value: 'CRITICAL', label: 'Critical (Within 2 hours)', color: 'text-red-600' },
  { value: 'URGENT', label: 'Urgent (Within 24 hours)', color: 'text-orange-600' },
  { value: 'NORMAL', label: 'Normal (Within 3 days)', color: 'text-green-600' }
]

export function BloodRequestForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<BloodRequestForm>({
    resolver: zodResolver(bloodRequestSchema),
    defaultValues: {
      unitsRequired: 1
    }
  })

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const nextStep = async () => {
    let fieldsToValidate: (keyof BloodRequestForm)[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['requesterName', 'requesterPhone']
      // Email is optional, so only validate if it has a value
      const emailValue = watch('requesterEmail')
      if (emailValue && emailValue.trim() !== '') {
        fieldsToValidate.push('requesterEmail')
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ['bloodType', 'location', 'hospital', 'urgencyLevel', 'unitsRequired']
    }

    console.log('Validating fields for step', currentStep, fieldsToValidate)
    const isValid = await trigger(fieldsToValidate)
    console.log('Validation result:', isValid)
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else if (!isValid) {
      toast.error('Please fill in all required fields correctly')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type and size
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPG, or PNG file')
        return
      }

      if (file.size > maxSize) {
        toast.error('File size must be less than 5MB')
        return
      }

      setUploadedFile(file)
      toast.success('File uploaded successfully')
    }
  }

  const onSubmit = async (data: BloodRequestForm) => {
    console.log('Form submission triggered', { currentStep, data })
    
    // Only submit if we're on the final step
    if (currentStep !== totalSteps) {
      console.log('Not on final step, preventing submission')
      return
    }

    setIsSubmitting(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      if (uploadedFile) {
        formData.append('prescription', uploadedFile)
      }

      console.log('Submitting form data:', Object.fromEntries(formData.entries()))

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', errorData)
        throw new Error(`Failed to submit request: ${response.status}`)
      }

      const result = await response.json()
      
      toast.success('Blood request submitted successfully!')
      router.push(`/request/confirmation?ref=${result.referenceId}`)
    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Blood Request Form</CardTitle>
            <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
          </div>
          <div className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent>
        <form className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="requesterName">Full Name *</Label>
                <Input
                  id="requesterName"
                  placeholder="Enter your full name"
                  {...register('requesterName')}
                  className={errors.requesterName ? 'border-red-500' : ''}
                />
                {errors.requesterName && (
                  <p className="text-sm text-red-500">{errors.requesterName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requesterPhone">Phone Number *</Label>
                <Input
                  id="requesterPhone"
                  placeholder="+880 1700-000000"
                  {...register('requesterPhone')}
                  className={errors.requesterPhone ? 'border-red-500' : ''}
                />
                {errors.requesterPhone && (
                  <p className="text-sm text-red-500">{errors.requesterPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="requesterEmail">Email Address (Optional)</Label>
                <Input
                  id="requesterEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register('requesterEmail')}
                  className={errors.requesterEmail ? 'border-red-500' : ''}
                />
                {errors.requesterEmail && (
                  <p className="text-sm text-red-500">{errors.requesterEmail.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Blood Request Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blood Request Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Blood Type *</Label>
                  <Select onValueChange={(value) => setValue('bloodType', value as any)}>
                    <SelectTrigger className={errors.bloodType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bloodType && (
                    <p className="text-sm text-red-500">{errors.bloodType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Location *</Label>
                  <Select onValueChange={(value) => setValue('location', value)}>
                    <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location && (
                    <p className="text-sm text-red-500">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital Name *</Label>
                <Input
                  id="hospital"
                  placeholder="Enter hospital name"
                  {...register('hospital')}
                  className={errors.hospital ? 'border-red-500' : ''}
                />
                {errors.hospital && (
                  <p className="text-sm text-red-500">{errors.hospital.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Urgency Level *</Label>
                <Select onValueChange={(value) => setValue('urgencyLevel', value as any)}>
                  <SelectTrigger className={errors.urgencyLevel ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <span className={level.color}>{level.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.urgencyLevel && (
                  <p className="text-sm text-red-500">{errors.urgencyLevel.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitsRequired">Units Required *</Label>
                <Input
                  id="unitsRequired"
                  type="number"
                  min="1"
                  max="10"
                  {...register('unitsRequired', { valueAsNumber: true })}
                  className={errors.unitsRequired ? 'border-red-500' : ''}
                />
                {errors.unitsRequired && (
                  <p className="text-sm text-red-500">{errors.unitsRequired.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Additional Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the patient's condition or special requirements..."
                  rows={4}
                  {...register('notes')}
                />
              </div>

              <div className="space-y-2">
                <Label>Prescription/Medical Document (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {uploadedFile ? (
                      <div className="flex items-center justify-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>{uploadedFile.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                        <div className="text-sm text-gray-600">
                          Click to upload prescription or medical document
                        </div>
                        <div className="text-xs text-gray-500">
                          PDF, JPG, PNG up to 5MB
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  By submitting this form, you confirm that the information provided is accurate 
                  and you consent to being contacted by our team and matched donors.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            ) : (
              <Button 
                type="button" 
                onClick={() => {
                  console.log('Submit button clicked, current step:', currentStep)
                  if (currentStep === totalSteps) {
                    handleSubmit(onSubmit)()
                  }
                }} 
                disabled={isSubmitting || currentStep !== totalSteps} 
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Blood Request'
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}