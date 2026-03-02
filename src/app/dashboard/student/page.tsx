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
            <header style={{ marginBottom: '80px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '8px 16px',
                    borderRadius: '100px',
                    background: 'rgba(237, 255, 102, 0.1)',
                    color: 'var(--primary)',
                    marginBottom: '24px',
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(237, 255, 102, 0.2)',
                    boxShadow: '0 0 20px rgba(237, 255, 102, 0.1)'
                }}>
                    Institutional Wallet
                </div>
                <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.04em', lineHeight: '1' }}>
                    YOUR <span style={{ color: 'var(--primary)' }}>PASSES</span>
                </h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                    Secure, high-fidelity digital access for campus events.
                </p>
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
                <div style={{ display: 'grid', gap: '40px' }}>
                    {passes.map((pass: any) => (
                        <div key={pass.id} className="animate-fade ticket-container responsive-grid mobile-ticket" style={{
                            gridTemplateColumns: '1fr 280px',
                            background: 'rgba(255,255,255,0.02)',
                        }}>
                            {/* Ticket Info Section */}
                            <div style={{ padding: '40px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div className={`neon-badge ${pass.status === 'valid' ? 'neon-badge-success' : 'neon-badge-muted'}`}>
                                        {pass.status === 'valid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                        {pass.status === 'valid' ? 'Verified Pass' : 'Already Scanned'}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontWeight: 'bold', fontFamily: 'monospace' }}>#{pass.id.slice(0, 8).toUpperCase()}</span>
                                </div>

                                <h3 style={{ fontSize: '2rem', lineHeight: '1.1', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.03em' }}>
                                    {pass.events.title}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', marginBottom: '2px' }}>Date & Time</p>
                                            <p style={{ fontWeight: '600', fontSize: '1rem' }}>{new Date(pass.events.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <MapPin size={18} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-foreground)', marginBottom: '2px' }}>Location</p>
                                            <p style={{ fontWeight: '600', fontSize: '1rem' }}>{pass.events.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link href={`/pass/${pass.id}`} className="button button-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '100px' }}>
                                    Full Pass Details <ArrowRight size={16} />
                                </Link>
                            </div>

                            {/* Center Perforation - Mobile Hide handled in CSS */}
                            <div className="perforation-line mobile-hide" style={{ position: 'absolute', top: '0', bottom: '0', right: '280px', margin: '0', borderLeft: '2px dashed rgba(255,255,255,0.1)', borderTop: 'none', width: '2px' }}>
                                <div style={{ position: 'absolute', top: '-12px', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--background)', border: '1px solid var(--border)' }}></div>
                                <div style={{ position: 'absolute', bottom: '-12px', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--background)', border: '1px solid var(--border)' }}></div>
                            </div>

                            {/* QR Section */}
                            <div className="mobile-qr-section" style={{
                                background: 'rgba(255,255,255,0.01)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '40px',
                                borderLeft: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{
                                    borderRadius: '24px',
                                    background: 'white',
                                    padding: '16px',
                                    boxShadow: pass.status === 'valid' ? '0 0 40px rgba(237, 255, 102, 0.2)' : 'none',
                                    marginBottom: '24px',
                                    opacity: pass.status === 'valid' ? 1 : 0.2,
                                    filter: pass.status === 'valid' ? 'none' : 'grayscale(1)',
                                    transition: 'all 0.5s ease'
                                }}>
                                    <QRCodeSVG
                                        value={pass.qr_code}
                                        size={160}
                                        level="H"
                                        includeMargin={false}
                                        fgColor={pass.status === 'valid' ? '#000' : '#444'}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Gate Code</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '0.1em', color: pass.status === 'valid' ? 'var(--primary)' : 'var(--muted-foreground)' }}>
                                        {pass.qr_code.slice(0, 8).toUpperCase()}
                                    </p>
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
