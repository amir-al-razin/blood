'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { signInWithEmail, signUpWithEmail } from '@/lib/firebase-auth'
import { toast } from 'sonner'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().regex(/^(\+880|880|0)?1[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface AuthFormProps {
    mode: 'login' | 'register'
    defaultValues?: {
        email?: string
        name?: string
    }
    onSuccess: (token: string, userData: { email: string; name?: string; phone?: string }) => Promise<void>
}

export function AuthForm({ mode, defaultValues, onSuccess }: AuthFormProps) {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const isLogin = mode === 'login'

    const loginForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: defaultValues?.email || '',
            password: ''
        }
    })

    const registerForm = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: defaultValues?.name || '',
            email: defaultValues?.email || '',
            phone: '',
            password: '',
            confirmPassword: ''
        }
    })

    const form = isLogin ? loginForm : registerForm

    const handleSubmit = async (data: LoginFormData | RegisterFormData) => {
        setLoading(true)

        try {
            let result

            if (isLogin) {
                const loginData = data as LoginFormData
                result = await signInWithEmail(loginData.email, loginData.password)
            } else {
                const registerData = data as RegisterFormData
                result = await signUpWithEmail(registerData.email, registerData.password, registerData.name)
            }

            if (!result.success || !result.user) {
                toast.error(result.error || `Failed to ${isLogin ? 'sign in' : 'create account'}`)
                return
            }

            // Get token and call onSuccess
            const token = await result.user.getIdToken()

            if (isLogin) {
                await onSuccess(token, { email: result.user.email || '' })
            } else {
                const registerData = data as RegisterFormData
                await onSuccess(token, {
                    email: registerData.email,
                    name: registerData.name,
                    phone: registerData.phone
                })
            }
        } catch (error: any) {
            console.error('Auth error:', error)
            toast.error(error.message || `Failed to ${isLogin ? 'sign in' : 'create account'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={isLogin ? loginForm.handleSubmit(handleSubmit) : registerForm.handleSubmit(handleSubmit)} className="space-y-4">
            {!isLogin && (
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                        id="name"
                        placeholder="Enter your full name"
                        {...registerForm.register('name')}
                        className={registerForm.formState.errors.name ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...(isLogin ? loginForm.register('email') : registerForm.register('email'))}
                    className={(isLogin ? loginForm.formState.errors.email : registerForm.formState.errors.email) ? 'border-red-500' : ''}
                />
                {(isLogin ? loginForm.formState.errors.email : registerForm.formState.errors.email) && (
                    <p className="text-sm text-red-500">{(isLogin ? loginForm.formState.errors.email : registerForm.formState.errors.email)?.message}</p>
                )}
            </div>

            {!isLogin && (
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+880 1XXX-XXXXXX"
                        {...registerForm.register('phone')}
                        className={registerForm.formState.errors.phone ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
                    )}
                    <p className="text-xs text-gray-500">
                        Your phone number will be verified by our admin team.
                    </p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                        {...(isLogin ? loginForm.register('password') : registerForm.register('password'))}
                        className={(isLogin ? loginForm.formState.errors.password : registerForm.formState.errors.password) ? 'border-red-500 pr-10' : 'pr-10'}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {(isLogin ? loginForm.formState.errors.password : registerForm.formState.errors.password) && (
                    <p className="text-sm text-red-500">{(isLogin ? loginForm.formState.errors.password : registerForm.formState.errors.password)?.message}</p>
                )}
            </div>

            {!isLogin && (
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        {...registerForm.register('confirmPassword')}
                        className={registerForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                </div>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                )}
            </Button>
        </form>
    )
}
