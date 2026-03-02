'use server'

import { createServiceClient } from '@/utils/supabase/service'
import { sendOTPEmail } from '@/utils/resend'

export async function requestOTP(email: string) {
    const supabase = createServiceClient()

    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
        },
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function verifyOTP(email: string, token: string) {
    const supabase = createServiceClient()

    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup' // or 'magiclink' depending on flow, but signUp uses 'signup' or 'email'
    })

    if (error) {
        // Fallback check for 'email' type if 'signup' fails (Supabase sometimes uses 'email' for OTP)
        const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })

        if (retryError) return { success: false, error: retryError.message }
        return { success: true, user: retryData.user }
    }

    return { success: true, user: data.user }
}
