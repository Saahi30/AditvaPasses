'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Calendar, MapPin, ArrowLeft, Download,
    ExternalLink, ShieldCheck, Ticket,
    Building2, Info, Loader2, Share2
} from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useRouter } from 'next/navigation'

export default function PassDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const [pass, setPass] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchPassDetails()
    }, [resolvedParams.id])

    async function fetchPassDetails() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/auth')
            return
        }

        const { data, error: passError } = await supabase
            .from('passes')
            .select(`
                *,
                events (
                    *,
                    clubs (*)
                )
            `)
            .eq('id', resolvedParams.id)
            .single()

        if (passError || !data) {
            setError('Pass not found or access denied.')
        } else if (data.user_id !== user.id) {
            setError('You do not have permission to view this pass.')
        } else {
            setPass(data)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
                <Loader2 className="spinner" size={48} style={{ color: 'var(--primary)' }} />
                <p style={{ marginTop: '16px', color: 'var(--muted-foreground)' }}>Retrieving your digital pass...</p>
            </div>
        )
    }

    if (error || !pass) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,85,85,0.1)', color: '#ff5555', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Info size={40} />
                </div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{error || 'Error loading pass'}</h1>
                <Link href="/dashboard" className="button button-outline">Return to Wallet</Link>
            </div>
        )
    }

    const { events: event } = pass
    const isUsed = pass.status === 'used'

    return (
        <main style={{ minHeight: '100vh', padding: '120px 24px 80px', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '40px', fontSize: '0.9rem', textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Wallet
            </Link>

            <div className="animate-fade" style={{ display: 'grid', gap: '40px' }}>

                {/* Header Section */}
                <section style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '8px 20px',
                        borderRadius: '100px',
                        background: isUsed ? 'rgba(255,255,255,0.05)' : 'rgba(34, 197, 94, 0.1)',
                        color: isUsed ? 'var(--muted-foreground)' : '#4ade80',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        marginBottom: '24px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {isUsed ? 'Pass Redeemed' : 'Valid Entry Pass'}
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px', lineHeight: '1.2' }}>{event.title}</h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>{event.description}</p>
                </section>

                {/* Main Pass Design */}
                <div className="glass" style={{
                    padding: '0',
                    borderRadius: '32px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Top Section with Event Image */}
                    {event.images?.[0] ? (
                        <div style={{ height: '240px', width: '100%', position: 'relative' }}>
                            <img src={event.images[0]} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(10,10,11,0.9))' }}></div>
                        </div>
                    ) : (
                        <div style={{ height: '200px', width: '100%', background: 'linear-gradient(45deg, #1a1a1c, #252528)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Ticket size={80} style={{ opacity: 0.1 }} />
                        </div>
                    )}

                    <div style={{ padding: '40px' }}>
                        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }}>
                            {/* Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '4px' }}>Time & Date</p>
                                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{new Date(event.event_date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '4px' }}>Location</p>
                                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{event.location}</p>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                                            target="_blank"
                                            style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                                        >
                                            View on Map <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.05em', marginBottom: '4px' }}>Organized By</p>
                                        <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{event.clubs?.name || 'College Event'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Large QR */}
                            <div style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '24px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                                opacity: isUsed ? 0.3 : 1,
                                filter: isUsed ? 'grayscale(1)' : 'none'
                            }}>
                                <QRCodeSVG
                                    value={pass.qr_code}
                                    size={180}
                                    level="H"
                                />
                                <div style={{ textAlign: 'center', marginTop: '16px', color: 'black' }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: '800', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gate ID</p>
                                    <p style={{ fontWeight: '900', fontSize: '1.2rem' }}>{pass.qr_code.slice(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '2px dashed var(--border)', margin: '40px 0', opacity: 0.5 }}></div>

                        {/* Footer Details */}
                        <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '4px' }}>Ticket Holder</p>
                                <p style={{ fontWeight: '700' }}>#{pass.id.toUpperCase()}</p>
                            </div>
                            <div className="mobile-stack" style={{ display: 'flex', gap: '12px' }}>
                                {event.brochure_url && (
                                    <a href={event.brochure_url} target="_blank" className="button button-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                        <Download size={16} /> Brochure
                                    </a>
                                )}
                                <button onClick={() => window.print()} className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                    <Share2 size={16} /> Print Pass
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Entry Guidelines */}
                <section className="glass" style={{ padding: '32px', borderRadius: '24px', background: 'rgba(237,255,102,0.02)', border: '1px solid rgba(237,255,102,0.1)' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                        <ShieldCheck style={{ color: 'var(--primary)' }} />
                        <h4 style={{ fontSize: '1.1rem' }}>Entry Instructions</h4>
                    </div>
                    <ul style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px' }}>
                        <li>Carry this digital pass on your smartphone.</li>
                        <li>Individual entry per pass. Valid for one-time scan only.</li>
                        <li>Possession of pass does not guarantee late entry after event start.</li>
                        <li>Keep your high-school/college ID card handy for verification if required.</li>
                    </ul>
                </section>
            </div>
        </main>
    )
}
