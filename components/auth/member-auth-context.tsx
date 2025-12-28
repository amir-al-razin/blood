'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { onAuthChange, signOutUser, getIdToken } from '@/lib/firebase-auth'

interface MemberData {
    id: string
    firebaseUid: string
    email: string
    phone: string
    name: string
    image?: string | null
    isPhoneVerified: boolean
    isEmailVerified: boolean
    donor?: {
        id: string
        isVerified: boolean
        verifiedAt?: Date | null
        bloodType: string
        gender: string
        lastDonation?: Date | null
        donationCount: number
        isAvailable: boolean
    } | null
}

interface MemberAuthContextType {
    user: User | null
    member: MemberData | null
    loading: boolean
    error: string | null
    signOut: () => Promise<void>
    refreshMember: () => Promise<void>
    getToken: () => Promise<string | null>
}

const MemberAuthContext = createContext<MemberAuthContextType | undefined>(undefined)

export function MemberAuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [member, setMember] = useState<MemberData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch member data from our API
    const fetchMemberData = async (firebaseUser: User) => {
        try {
            const token = await firebaseUser.getIdToken()
            const response = await fetch('/api/member/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setMember(data.member)
                setError(null)
            } else if (response.status === 404) {
                // User exists in Firebase but not in our db - needs to complete registration
                setMember(null)
                setError('NEEDS_REGISTRATION')
            } else {
                setMember(null)
                setError('Failed to fetch profile')
            }
        } catch (err) {
            console.error('Error fetching member data:', err)
            setMember(null)
            setError('Failed to load profile')
        }
    }

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                await fetchMemberData(firebaseUser)
            } else {
                setMember(null)
                setError(null)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    // Sign out
    const handleSignOut = async () => {
        try {
            await signOutUser()
            setUser(null)
            setMember(null)
            setError(null)
        } catch (err) {
            console.error('Sign out error:', err)
        }
    }

    // Refresh member data
    const refreshMember = async () => {
        if (user) {
            await fetchMemberData(user)
        }
    }

    // Get ID token for API requests
    const getToken = async (): Promise<string | null> => {
        return await getIdToken()
    }

    return (
        <MemberAuthContext.Provider
            value={{
                user,
                member,
                loading,
                error,
                signOut: handleSignOut,
                refreshMember,
                getToken
            }}
        >
            {children}
        </MemberAuthContext.Provider>
    )
}

// Hook to use member auth context
export function useMemberAuth() {
    const context = useContext(MemberAuthContext)
    if (context === undefined) {
        throw new Error('useMemberAuth must be used within a MemberAuthProvider')
    }
    return context
}

// Hook to require authenticated member (redirects if not authenticated)
export function useRequireMember() {
    const { user, member, loading, error } = useMemberAuth()

    return {
        user,
        member,
        loading,
        isAuthenticated: !!user,
        needsRegistration: error === 'NEEDS_REGISTRATION',
        isDonor: !!member?.donor,
        isVerifiedDonor: !!member?.donor?.isVerified
    }
}
