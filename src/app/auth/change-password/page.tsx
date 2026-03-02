'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Lock, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()
    const router = useRouter()

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setIsLoading(true)
        setError('')

        const { error: authError } = await supabase.auth.updateUser({
            password: password
        })

        if (authError) {
            setError(authError.message)
            setIsLoading(false)
            return
        }

        // Update profile requirement
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase
                .from('profiles')
                .update({ requires_password_change: false })
                .eq('id', user.id)
        }

        router.push('/dashboard')
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="glass animate-fade" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(237, 255, 102, 0.1)', marginBottom: '20px' }}>
                        <ShieldAlert size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Security Update</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                        This is your first login. For your security, please set a new password.
                    </p>
                </div>

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', borderRadius: '14px', outline: 'none' }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', borderRadius: '14px', outline: 'none' }}
                        />
                    </div>

                    {error && <p style={{ color: '#ff5555', fontSize: '0.8rem', textAlign: 'center' }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="button button-primary"
                        style={{ width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px' }}
                    >
                        {isLoading ? <Loader2 className="spinner" size={20} /> : (
                            <>
                                Update Password <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </main>
    )
}
