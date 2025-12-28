'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMemberAuth, useRequireMember } from '@/components/auth/member-auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Heart, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getIdToken } from '@/lib/firebase-auth'

const donorApplicationSchema = z.object({
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
    weight: z.number().min(50, 'Weight must be at least 50 kg').max(200),
    lastDonation: z.string().optional(),
    isAvailable: z.boolean().default(true),
    allowContactByPhone: z.boolean().default(true),
    allowContactByEmail: z.boolean().default(true),
    allowDataSharing: z.boolean().default(false)
})

type DonorApplicationForm = z.infer<typeof donorApplicationSchema>

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

export default function DonorApplyPage() {
    const router = useRouter()
    const { member, loading, refreshMember } = useMemberAuth()
    const { isAuthenticated, isDonor } = useRequireMember()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<DonorApplicationForm>({
        resolver: zodResolver(donorApplicationSchema),
        defaultValues: {
            isAvailable: true,
            allowContactByPhone: true,
            allowContactByEmail: true,
            allowDataSharing: false
        }
    })

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/member/login?redirect=/member/donor/apply')
        }
    }, [loading, isAuthenticated, router])

    // Redirect if already a donor
    useEffect(() => {
        if (!loading && isDonor) {
            toast.info('You are already registered as a donor')
            router.push('/member/dashboard')
        }
    }, [loading, isDonor, router])

    if (loading || !member) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    const onSubmit = async (data: DonorApplicationForm) => {
        setIsSubmitting(true)

        try {
            const token = await getIdToken()
            if (!token) {
                toast.error('Session expired. Please log in again.')
                router.push('/member/login')
                return
            }

            const response = await fetch('/api/member/donor/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            if (response.ok) {
                toast.success(result.message || 'Application submitted successfully!')
                await refreshMember()
                router.push('/member/dashboard')
            } else {
                toast.error(result.error || 'Failed to submit application')
            }
        } catch (error) {
            console.error('Error submitting application:', error)
            toast.error('Failed to submit application')
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalSteps = 3
    const progress = (step / totalSteps) * 100

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <Link href="/member/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <Heart className="h-8 w-8 text-red-600" />
                            <div>
                                <CardTitle className="text-2xl">Become a Blood Donor</CardTitle>
                                <CardDescription>
                                    Step {step} of {totalSteps}
                                </CardDescription>
                            </div>
                        </div>
                        <Progress value={progress} className="mt-4" />
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Step 1: Basic Info */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Basic Information</h3>

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
                                            <Label htmlFor="weight">Weight (kg) *</Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                min="30"
                                                max="200"
                                                placeholder="e.g., 65"
                                                {...register('weight', { valueAsNumber: true })}
                                                className={errors.weight ? 'border-red-500' : ''}
                                            />
                                            {errors.weight && (
                                                <p className="text-sm text-red-500">{errors.weight.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Location */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Location Details</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>City/District *</Label>
                                            <Select onValueChange={(value) => setValue('location', value)}>
                                                <SelectTrigger className={errors.location ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select city" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((loc) => (
                                                        <SelectItem key={loc} value={loc}>
                                                            {loc}
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
                                        <Input
                                            id="address"
                                            placeholder="House/Flat number, Road, Area"
                                            {...register('address')}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="lastDonation">Last Donation Date (Optional)</Label>
                                        <Input
                                            id="lastDonation"
                                            type="date"
                                            {...register('lastDonation')}
                                        />
                                        <p className="text-sm text-gray-500">Leave blank if never donated</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Preferences */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Preferences & Consent</h3>

                                    <Alert className="bg-blue-50 border-blue-200">
                                        <AlertCircle className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800">
                                            Your profile will be reviewed by our admin team. You'll receive a "Verified Donor" badge once approved.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="isAvailable"
                                                checked={watch('isAvailable')}
                                                onCheckedChange={(checked) => setValue('isAvailable', checked as boolean)}
                                            />
                                            <Label htmlFor="isAvailable">I am currently available for blood donation</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="allowContactByPhone"
                                                checked={watch('allowContactByPhone')}
                                                onCheckedChange={(checked) => setValue('allowContactByPhone', checked as boolean)}
                                            />
                                            <Label htmlFor="allowContactByPhone">Allow contact via phone/SMS</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="allowContactByEmail"
                                                checked={watch('allowContactByEmail')}
                                                onCheckedChange={(checked) => setValue('allowContactByEmail', checked as boolean)}
                                            />
                                            <Label htmlFor="allowContactByEmail">Allow contact via email</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="allowDataSharing"
                                                checked={watch('allowDataSharing')}
                                                onCheckedChange={(checked) => setValue('allowDataSharing', checked as boolean)}
                                            />
                                            <Label htmlFor="allowDataSharing">Allow anonymized data for research</Label>
                                        </div>
                                    </div>

                                    <Alert className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            By submitting, you agree to our privacy policy and consent to be contacted for blood donation requests.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(Math.max(1, step - 1))}
                                    disabled={step === 1}
                                >
                                    Previous
                                </Button>

                                {step < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={() => setStep(step + 1)}
                                    >
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
