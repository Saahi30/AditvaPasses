'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAsDemo(role: 'student' | 'admin') {
    const supabase = await createClient()

    const credentials = {
        student: {
            email: 'demo-student@aditvapasses.com',
            password: 'demo-password123'
        },
        admin: {
            email: 'demo-admin@aditvapasses.com',
            password: 'demo-password123'
        }
    }

    const { email, password } = credentials[role]

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        // If login fails, user might not exist. 
        // In a real app we'd pre-seed this, but for the demo we'll return the error.
        return { success: false, error: error.message }
    }

    redirect('/dashboard')
}
