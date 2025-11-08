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
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, AlertCircle, CheckCircle, Calendar, Heart } from 'lucide-react'
import { toast } from 'sonner'

const donorRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
  location: z.string().min(1, 'Please select a location'),
  area: z.string().min(2, 'Area is required'),
  address: z.string().optional(),
  dateOfBirth: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 65
  }, 'You must be between 18 and 65 years old'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  weight: z.number().min(50, 'Weight must be at least 50 kg').max(200, 'Please enter a valid weight'),
  lastDonation: z.string().optional(),
  hasHealthConditions: z.boolean(),
  healthConditions: z.string().optional(),
  medications: z.string().optional(),
  isAvailable: z.boolean().default(true),
  privacyConsent: z.boolean().refine((val) => val === true, 'You must agree to the privacy policy'),
  termsConsent: z.boolean().refine((val) => val === true, 'You must agree to the terms and conditions')
})

type DonorRegistrationForm = z.infer<typeof donorRegistrationSchema>

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

export function DonorRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eligibilityStatus, setEligibilityStatus] = useState<'checking' | 'eligible' | 'ineligible' | null>(null)
  const [nextEligibleDate, setNextEligibleDate] = useState<string | null>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<DonorRegistrationForm>({
    resolver: zodResolver(donorRegistrationSchema),
    defaultValues: {
      isAvailable: true,
      hasHealthConditions: false,
      privacyConsent: false,
      termsConsent: false
    }
  })

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const watchedValues = watch()

  const calculateEligibility = () => {
    const { lastDonation, gender, weight, hasHealthConditions } = watchedValues

    setEligibilityStatus('checking')

    // Check weight requirement
    if (weight < 50) {
      setEligibilityStatus('ineligible')
      return
    }

    // Check health conditions
    if (hasHealthConditions) {
      setEligibilityStatus('ineligible')
      return
    }

    // Check last donation date
    if (lastDonation) {
      const lastDonationDate = new Date(lastDonation)
      const today = new Date()
      const daysSinceLastDonation = Math.floor((today.getTime() - lastDonationDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const requiredGap = gender === 'MALE' ? 90 : 120 // 90 days for males, 120 for females
      
      if (daysSinceLastDonation < requiredGap) {
        const nextEligible = new Date(lastDonationDate)
        nextEligible.setDate(nextEligible.getDate() + requiredGap)
        setNextEligibleDate(nextEligible.toLocaleDateString())
        setEligibilityStatus('ineligible')
        return
      }
    }

    setEligibilityStatus('eligible')
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof DonorRegistrationForm)[] = []
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'phone', 'email', 'bloodType']
    } else if (currentStep === 2) {
      fieldsToValidate = ['location', 'area', 'dateOfBirth', 'gender', 'weight']
    } else if (currentStep === 3) {
      // Calculate eligibility when moving from step 3
      calculateEligibility()
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: DonorRegistrationForm) => {
    if (eligibilityStatus !== 'eligible') {
      toast.error('Please complete the eligibility check first')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/donors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          lastDonation: data.lastDonation || null,
          email: data.email || null,
          address: data.address || null,
          healthConditions: data.hasHealthConditions ? data.healthConditions : null,
          medications: data.medications || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to register donor')
      }

      const result = await response.json()
      
      toast.success('Registration submitted successfully!')
      router.push(`/donate/confirmation?id=${result.donorId}`)
    } catch (error) {
      toast.error('Failed to register. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Donor Registration</CardTitle>
            <CardDescription>Step {currentStep} of {totalSteps}</CardDescription>
          </div>
          <div className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+880 1700-000000"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Blood Type *</Label>
                <Select onValueChange={(value) => setValue('bloodType', value as any)}>
                  <SelectTrigger className={errors.bloodType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your blood type" />
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
            </div>
          )}

          {/* Step 2: Location & Personal Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Location & Personal Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City/District *</Label>
                  <Select onValueChange={(value) => setValue('location', value)}>
                    <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select city" />
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

                <div className="space-y-2">
                  <Label htmlFor="area">Area/Thana *</Label>
                  <Input
                    id="area"
                    placeholder="e.g., Dhanmondi, Gulshan"
                    {...register('area')}
                    className={errors.area ? 'border-red-500' : ''}
                  />
                  {errors.area && (
                    <p className="text-sm text-red-500">{errors.area.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address (Optional)</Label>
                <Textarea
                  id="address"
                  placeholder="House/Flat number, Road, Area"
                  {...register('address')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                    className={errors.dateOfBirth ? 'border-red-500' : ''}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select onValueChange={(value) => setValue('gender', value as any)}>
                    <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="30"
                  max="200"
                  placeholder="Enter your weight in kg"
                  {...register('weight', { valueAsNumber: true })}
                  className={errors.weight ? 'border-red-500' : ''}
                />
                {errors.weight && (
                  <p className="text-sm text-red-500">{errors.weight.message}</p>
                )}
                <p className="text-sm text-gray-500">
                  Minimum weight requirement: 50 kg
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Medical History */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Medical History & Eligibility
              </h3>

              <div className="space-y-2">
                <Label htmlFor="lastDonation">Last Blood Donation Date (Optional)</Label>
                <Input
                  id="lastDonation"
                  type="date"
                  {...register('lastDonation')}
                />
                <p className="text-sm text-gray-500">
                  Leave blank if you've never donated before
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasHealthConditions"
                    checked={watchedValues.hasHealthConditions}
                    onCheckedChange={(checked) => setValue('hasHealthConditions', checked as boolean)}
                  />
                  <Label htmlFor="hasHealthConditions">
                    I have ongoing health conditions or take regular medications
                  </Label>
                </div>

                {watchedValues.hasHealthConditions && (
                  <div className="space-y-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="healthConditions">Health Conditions</Label>
                      <Textarea
                        id="healthConditions"
                        placeholder="Please describe any health conditions..."
                        {...register('healthConditions')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medications">Current Medications</Label>
                      <Textarea
                        id="medications"
                        placeholder="Please list any medications you're taking..."
                        {...register('medications')}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> You cannot donate blood if you:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Weigh less than 50 kg</li>
                    <li>Have donated blood in the last 90 days (males) or 120 days (females)</li>
                    <li>Have certain health conditions or infections</li>
                    <li>Are taking certain medications</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 4: Eligibility Check & Consent */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Eligibility Check & Consent
              </h3>

              {/* Eligibility Status */}
              {eligibilityStatus && (
                <div className="mb-6">
                  {eligibilityStatus === 'checking' && (
                    <Alert>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <AlertDescription>
                        Checking your eligibility...
                      </AlertDescription>
                    </Alert>
                  )}

                  {eligibilityStatus === 'eligible' && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>Great news!</strong> You are eligible to donate blood. 
                        You can proceed with the registration.
                      </AlertDescription>
                    </Alert>
                  )}

                  {eligibilityStatus === 'ineligible' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Sorry,</strong> you are currently not eligible to donate blood.
                        {nextEligibleDate && (
                          <span> You can donate again after {nextEligibleDate}.</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Availability */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAvailable"
                    checked={watchedValues.isAvailable}
                    onCheckedChange={(checked) => setValue('isAvailable', checked as boolean)}
                  />
                  <Label htmlFor="isAvailable">
                    I am currently available for blood donation
                  </Label>
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacyConsent"
                    checked={watchedValues.privacyConsent}
                    onCheckedChange={(checked) => setValue('privacyConsent', checked as boolean)}
                    className={errors.privacyConsent ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="privacyConsent" className="text-sm leading-relaxed">
                    I agree to the <Link href="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link> and 
                    consent to my contact information being shared with verified medical staff only.
                  </Label>
                </div>
                {errors.privacyConsent && (
                  <p className="text-sm text-red-500 ml-6">{errors.privacyConsent.message}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsConsent"
                    checked={watchedValues.termsConsent}
                    onCheckedChange={(checked) => setValue('termsConsent', checked as boolean)}
                    className={errors.termsConsent ? 'border-red-500' : ''}
                  />
                  <Label htmlFor="termsConsent" className="text-sm leading-relaxed">
                    I agree to the <Link href="/terms" className="text-red-600 hover:underline">Terms and Conditions</Link> and 
                    understand that I may be contacted for blood donation requests.
                  </Label>
                </div>
                {errors.termsConsent && (
                  <p className="text-sm text-red-500 ml-6">{errors.termsConsent.message}</p>
                )}
              </div>

              <Alert>
                <Heart className="h-4 w-4" />
                <AlertDescription>
                  By registering as a donor, you're joining a community of heroes who save lives. 
                  Your information will be kept secure and only used for blood donation coordination.
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
                type="submit" 
                disabled={isSubmitting || eligibilityStatus !== 'eligible'} 
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}