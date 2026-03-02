'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Calendar, MapPin, ArrowLeft, Download,
    Link as LinkIcon, Building2, Ticket,
    Share2, Info, Loader2, Sparkles, User as UserIcon
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const [event, setEvent] = useState<any>(null)
    const [hasPass, setHasPass] = useState(false)
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [attendanceCount, setAttendanceCount] = useState(0)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let channel: any;

        async function init() {
            setLoading(true)
            const { data: eventData } = await supabase
                .from('events')
                .select('*, clubs(*)')
                .eq('id', resolvedParams.id)
                .single()

            if (eventData) {
                setEvent(eventData)
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                    setProfile(profileData)
                    const { data: pass } = await supabase.from('passes').select('id').eq('event_id', eventData.id).eq('user_id', user.id).single()
                    if (pass) setHasPass(true)
                }

                const { count } = await supabase.from('passes').select('*', { count: 'exact', head: true }).eq('event_id', eventData.id).eq('status', 'used')
                setAttendanceCount(count || 0)

                channel = supabase
                    .channel(`event-attendance-${eventData.id}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'passes',
                        filter: `event_id=eq.${eventData.id}`
                    }, (payload) => {
                        if (payload.new.status === 'used' && payload.old.status !== 'used') {
                            setAttendanceCount(prev => prev + 1)
                        }
                    })
                    .subscribe()
            }
            setLoading(false)
        }

        init()

        return () => {
            if (channel) supabase.removeChannel(channel)
        }
    }, [resolvedParams.id])

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0b' }}>
                <Loader2 className="spinner" size={48} style={{ color: 'var(--primary)' }} />
                <p style={{ marginTop: '16px', color: 'var(--muted-foreground)' }}>Loading event details...</p>
            </div>
        )
    }

    if (!event) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                <Info size={48} style={{ color: 'var(--muted-foreground)', marginBottom: '24px' }} />
                <h1 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Event Not Found</h1>
                <Link href="/" className="button button-outline">Return Home</Link>
            </div>
        )
    }

    return (
        <main style={{ minHeight: '100vh', padding: '120px 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', marginBottom: '40px', fontSize: '0.9rem', textDecoration: 'none' }}>
                <ArrowLeft size={16} /> Back to Exploration
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '48px', alignItems: 'start' }} className="mobile-stack">

                {/* Left Column: Info */}
                <section className="animate-fade">
                    {/* Event Hero */}
                    <div className="glass" style={{ borderRadius: '32px', overflow: 'hidden', marginBottom: '40px', border: '1px solid var(--border)' }}>
                        {event.images?.[0] ? (
                            <img src={event.images[0]} alt={event.title} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ height: '300px', background: 'linear-gradient(45deg, #1a1a1c, #252528)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Ticket size={100} style={{ opacity: 0.1 }} />
                            </div>
                        )}

                        <div style={{ padding: '40px' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '6px 16px', borderRadius: '100px', background: 'rgba(237, 255, 102, 0.1)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                                    {event.clubs?.name || 'General Event'}
                                </div>
                            </div>
                            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '20px', lineHeight: '1.1' }}>{event.title}</h1>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{event.description}</p>
                        </div>
                    </div>

                    {/* Features/Highlights */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="glass" style={{ padding: '24px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Sparkles size={18} style={{ color: 'var(--primary)' }} /> Highlights
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Exclusive access, networking opportunities, and premium amenities included with your pass.</p>
                        </div>
                        <div className="glass" style={{ padding: '24px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <UserIcon size={18} style={{ color: 'var(--primary)' }} /> Capacity
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Limited to {event.max_capacity || 'all'} students. Passes issued strictly on merit or registration.</p>
                        </div>
                    </div>
                </section>

                {/* Right Column: Sidebar */}
                <aside className="animate-fade" style={{ position: 'sticky', top: '120px' }}>
                    <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>When</p>
                                    <p style={{ fontWeight: '600' }}>{new Date(event.event_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{new Date(event.event_date).toLocaleTimeString([], { timeStyle: 'short' })}</p>
                                </div>
                            </div>

                            {/* Live Attendance Tracker */}
                            {event.max_capacity > 0 && (
                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>Occupancy Status</p>
                                        <div style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(237, 255, 102, 0.1)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 'bold' }}>LIVE</div>
                                    </div>

                                    <div style={{ height: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden', marginBottom: '8px' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${Math.min(100, (attendanceCount / event.max_capacity) * 100)}%`,
                                            background: (attendanceCount / event.max_capacity) < 0.5 ? '#edff66' : (attendanceCount / event.max_capacity) < 0.8 ? '#ffb366' : '#ff6666',
                                            boxShadow: (attendanceCount / event.max_capacity) < 0.5 ? '0 0 10px rgba(237, 255, 102, 0.5)' : (attendanceCount / event.max_capacity) < 0.8 ? '0 0 10px rgba(255, 179, 102, 0.5)' : '0 0 10px rgba(255, 102, 102, 0.5)',
                                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s'
                                        }} />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{
                                            fontWeight: 'bold',
                                            color: (attendanceCount / event.max_capacity) < 0.5 ? '#edff66' : (attendanceCount / event.max_capacity) < 0.8 ? '#ffb366' : '#ff6666',
                                        }}>
                                            {attendanceCount === 0 ? 'Starting Soon' : `${Math.max(10, Math.round(((attendanceCount / event.max_capacity) * 100) / 10) * 10)}% Full`}
                                        </span>
                                        <span style={{ color: 'var(--muted-foreground)' }}>
                                            {(attendanceCount / event.max_capacity) < 0.3 ? 'Plenty of Space' : (attendanceCount / event.max_capacity) < 0.6 ? 'Filling Up' : (attendanceCount / event.max_capacity) < 0.9 ? 'Crowded' : 'At Max Capacity'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>Where</p>
                                    <p style={{ fontWeight: '600' }}>{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {hasPass ? (
                            <Link href="/dashboard" className="button button-primary" style={{ width: '100%', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <Ticket size={20} /> View Your Pass
                            </Link>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(237, 255, 102, 0.05)', border: '1px solid rgba(237, 255, 102, 0.2)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>ENTRY RESTRICTED</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>Passes are automatically issued to eligible students via email.</p>
                                </div>
                                {event.brochure_url && (
                                    <a href={event.brochure_url} target="_blank" className="button button-outline" style={{ height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        <Download size={18} /> Download Brochure
                                    </a>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.9rem' }}>Entry Fee</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>{event.price === 0 ? 'FREE' : `₹${event.price}`}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button className="button button-ghost" style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                            <Share2 size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Share Event
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    )
}
