'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Ticket as TicketIcon, Calendar, MapPin, Sparkles, Loader2, ArrowRight, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function StudentDashboard() {
    const [passes, setPasses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<any>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchUserData()
    }, [])

    async function fetchUserData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setUser(user)

        const { data } = await supabase
            .from('passes')
            .select(`
                *,
                events (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) setPasses(data)
        setLoading(false)
    }

    return (
        <main style={{ padding: '160px 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '64px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '16px', background: 'rgba(237, 255, 102, 0.05)', color: 'var(--primary)', marginBottom: '16px' }}>
                    <ShieldCheck size={24} />
                </div>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                    Pass <span style={{ color: 'var(--primary)' }}>Wallet</span>
                </h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Your secure digital entrance to campus events.</p>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Loader2 className="spinner" size={48} style={{ color: 'var(--primary)' }} />
                    <p style={{ marginTop: '16px', color: 'var(--muted-foreground)' }}>Syncing your passes...</p>
                </div>
            ) : passes.length === 0 ? (
                <section className="glass animate-fade" style={{ padding: '80px 40px', textAlign: 'center', borderRadius: '32px' }}>
                    <div style={{ display: 'inline-flex', padding: '32px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)', marginBottom: '24px' }}>
                        <TicketIcon size={48} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '16px', fontWeight: '700' }}>Your wallet is empty</h2>
                    <p style={{ color: 'var(--muted-foreground)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
                        Once you're registered for events by your college admin, your digital passes will appear here automatically.
                    </p>
                    <Link href="/" className="button button-primary" style={{ padding: '16px 32px' }}>Browse Home</Link>
                </section>
            ) : (
                <div style={{ display: 'grid', gap: '32px' }}>
                    {passes.map((pass: any) => (
                        <div key={pass.id} className="animate-fade responsive-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(300px, 1fr) 240px',
                            padding: '0',
                            overflow: 'hidden',
                            borderRadius: '24px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            position: 'relative'
                        }}>
                            {/* Ticket Info Section */}
                            <div style={{ padding: '40px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{
                                        padding: '6px 16px',
                                        borderRadius: '100px',
                                        background: pass.status === 'valid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: pass.status === 'valid' ? '#4ade80' : 'var(--muted-foreground)',
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        {pass.status === 'valid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {pass.status === 'valid' ? 'Verified Pass' : 'Already Scanned'}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}>#{pass.id.slice(0, 8).toUpperCase()}</span>
                                </div>

                                <h3 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '16px', color: 'white' }}>{pass.events.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--muted-foreground)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={16} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Date & Time</p>
                                            <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: '500' }}>{new Date(pass.events.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--muted-foreground)' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MapPin size={16} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Location</p>
                                            <p style={{ color: 'white', fontSize: '0.95rem', fontWeight: '500' }}>{pass.events.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <Link href={`/pass/${pass.id}`} className="button button-outline" style={{ fontSize: '0.85rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                                        Full Pass Details <ArrowRight size={14} />
                                    </Link>
                                </div>

                                {/* Perforation Lines */}
                                <div className="mobile-hide" style={{
                                    position: 'absolute',
                                    right: '-12px',
                                    top: '0',
                                    bottom: '0',
                                    width: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-around',
                                    zIndex: 2,
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0a0a0b', border: '1px solid var(--border)' }}></div>
                                    <div style={{ borderRight: '2px dashed var(--border)', height: '100%', margin: '0 auto' }}></div>
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0a0a0b', border: '1px solid var(--border)', marginTop: 'auto' }}></div>
                                </div>
                            </div>

                            {/* QR Section */}
                            <div style={{
                                background: pass.status === 'valid' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                                color: 'black',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px',
                                textAlign: 'center',
                                transition: 'all 0.3s'
                            }}>
                                <div style={{
                                    borderRadius: '20px',
                                    background: 'white',
                                    padding: '20px',
                                    boxShadow: pass.status === 'valid' ? '0 15px 35px rgba(237, 255, 102, 0.4)' : 'none',
                                    marginBottom: '20px',
                                    opacity: pass.status === 'valid' ? 1 : 0.3,
                                    filter: pass.status === 'valid' ? 'none' : 'grayscale(1)'
                                }}>
                                    <QRCodeSVG
                                        value={pass.qr_code}
                                        size={140}
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>
                                <div style={{ textAlign: 'center', color: pass.status === 'valid' ? 'black' : 'var(--muted-foreground)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Gate Entry Code</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: '900', letterSpacing: '0.05em' }}>{pass.qr_code.slice(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Wallet Tip */}
            <div className="glass animate-fade" style={{ marginTop: '64px', padding: '32px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid rgba(237, 255, 102, 0.1)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(237, 255, 102, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Express Entry Enabled</h4>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Show this QR code at the event gate for instant verification. Your pass works offline once loaded.</p>
                </div>
            </div>
        </main>
    )
}
