'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardRedirect() {
    const supabase = createClient()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth')
                return
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, requires_password_change')
                .eq('id', user.id)
                .single()

            if (error || !profile) {
                router.push('/')
                return
            }

            // Check if password change is forced
            if (profile.requires_password_change) {
                router.push('/auth/change-password')
                return
            }

            // Redirect based on role
            if (profile.role === 'super_admin') {
                router.push('/974hdjkfsdfh')
            } else if (profile.role === 'college_admin') {
                router.push('/dashboard/college-admin')
            } else {
                router.push('/dashboard/student')
            }
            setLoading(false)
        }

        checkUser()
    }, [router, supabase])

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} />
        </div>
    )
}
