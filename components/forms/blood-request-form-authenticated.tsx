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
import { Loader2, Upload, CheckCircle, AlertCircle, User, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useMemberAuth } from '@/components/auth/member-auth-context'

// Schema for authenticated blood request (no requester contact info - comes from member profile)
const bloodRequestSchema = z.object({
    bloodType: z.enum(['A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE']),
    location: z.string().min(1, 'Please select a location'),
    hospital: z.string().min(2, 'Hospital name is required'),
    urgencyLevel: z.enum(['CRITICAL', 'URGENT', 'NORMAL']),
    unitsRequired: z.number().min(1, 'At least 1 unit is required').max(10, 'Maximum 10 units allowed'),
    notes: z.string().optional()
})

type BloodRequestFormData = z.infer<typeof bloodRequestSchema>

interface MemberData {
    id: string
    name: string
    email: string
    phone: string
}

interface BloodRequestFormAuthenticatedProps {
    member: MemberData
}

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
    { value: 'CRITICAL', label: 'Critical (Within 2 hours)', color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'URGENT', label: 'Urgent (Within 24 hours)', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'NORMAL', label: 'Normal (Within 3 days)', color: 'text-green-600', bgColor: 'bg-green-50' }
]

export function BloodRequestFormAuthenticated({ member }: BloodRequestFormAuthenticatedProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const router = useRouter()
    const { getToken } = useMemberAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        trigger
    } = useForm<BloodRequestFormData>({
        resolver: zodResolver(bloodRequestSchema),
        defaultValues: {
            unitsRequired: 1
        }
    })

    const totalSteps = 2 // Reduced from 3 since we don't need personal info step
    const progress = (currentStep / totalSteps) * 100

    const nextStep = async () => {
        let fieldsToValidate: (keyof BloodRequestFormData)[] = []

        if (currentStep === 1) {
            fieldsToValidate = ['bloodType', 'location', 'hospital', 'urgencyLevel', 'unitsRequired']
        }

        const isValid = await trigger(fieldsToValidate)

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

    const onSubmit = async (data: BloodRequestFormData) => {
        if (currentStep !== totalSteps) {
            return
        }

        setIsSubmitting(true)

        try {
            // Get auth token
            const token = await getToken()
            if (!token) {
                toast.error('Session expired. Please log in again.')
                router.push('/member/login?intent=request-blood')
                return
            }

            // Create FormData for file upload
            const formData = new FormData()

            // Add form data
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    formData.append(key, value.toString())
                }
            })

            // Add member info (from authenticated profile)
            formData.append('requesterName', member.name)
            formData.append('requesterPhone', member.phone)
            formData.append('requesterEmail', member.email)
            formData.append('memberId', member.id)

            if (uploadedFile) {
                formData.append('prescription', uploadedFile)
            }

            const response = await fetch('/api/member/request-blood', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Failed to submit request: ${response.status}`)
            }

            const result = await response.json()

            toast.success('Blood request submitted successfully!')
            router.push(`/member/dashboard?requestSubmitted=${result.referenceId}`)
        } catch (error) {
            console.error('Submission error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.')
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
                {/* Member Info Preview - Always visible */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-3">Submitting as:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{member.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 truncate">{member.email}</span>
                        </div>
                    </div>
                </div>

                <form className="space-y-6">
                    {/* Step 1: Blood Request Details */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Blood Request Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Blood Type Required *</Label>
                                    <Select onValueChange={(value) => setValue('bloodType', value as any)}>
                                        <SelectTrigger className={errors.bloodType ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select blood type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bloodTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    <span className="font-semibold text-red-600">{type.label}</span>
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
                                    placeholder="Enter hospital name where blood is needed"
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
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${level.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                                                    <span className={level.color}>{level.label}</span>
                                                </div>
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
                                <p className="text-xs text-gray-500">Each unit is approximately 450ml of blood</p>
                                {errors.unitsRequired && (
                                    <p className="text-sm text-red-500">{errors.unitsRequired.message}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Additional Information & Review */}
                    {currentStep === 2 && (
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
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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

                            <Alert className="bg-blue-50 border-blue-200">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    By submitting this request, you confirm that the information provided is accurate.
                                    We will contact you at <strong>{member.phone}</strong> when we find matching donors.
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
                            <Button type="button" onClick={nextStep} className="bg-red-600 hover:bg-red-700">
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => {
                                    if (currentStep === totalSteps) {
                                        handleSubmit(onSubmit)()
                                    }
                                }}
                                disabled={isSubmitting}
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
