'use client'

import Link from 'next/link'
import { Ticket, User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase.auth])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.refresh()
    }

    return (
        <nav className="glass-premium" style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'max-content',
            minWidth: 'min(92%, 1000px)',
            padding: '12px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000,
            borderRadius: '100px',
        }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '900', fontSize: '1.25rem', letterSpacing: '-0.03em' }}>
                <div style={{ padding: '6px', borderRadius: '10px', background: 'var(--primary)', color: 'black' }}>
                    <Ticket style={{ width: '20px', height: '20px' }} />
                </div>
                <span className="nav-logo-text" style={{ display: 'inline-block' }}>ADITVA <span style={{ color: 'var(--primary)', opacity: 0.8 }}>PASSES</span></span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <Link href="/" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>Home</Link>
                    {user && <Link href="/dashboard" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: '500' }}>Wallet</Link>}
                </div>

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                        }}>
                            <User size={16} />
                        </div>
                        <button
                            onClick={handleSignOut}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--muted-foreground)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <Link href="/auth" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                    }}>
                        Login
                    </Link>
                )}
            </div>

            <style jsx>{`
        @media (max-width: 600px) {
          span { display: none !important; }
        }
      `}</style>
        </nav>
    )
}
