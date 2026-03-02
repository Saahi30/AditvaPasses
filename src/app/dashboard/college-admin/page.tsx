'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Plus, Ticket, QrCode, Filter, MoreVertical, Loader2,
    Calendar, MapPin, CheckCircle2, Users, Building2,
    Trash2, Image as ImageIcon, Link as LinkIcon, Info, X,
    Send, Settings, BarChart3, GraduationCap, CheckCircle
} from 'lucide-react'
import { createClub, getClubs, deleteClub, issuePasses, updateCollege, deleteEvent, updateEvent, getCollegeAnalytics, getStudents } from '@/app/actions/admin-actions'
import Scanner from '@/components/Scanner'

const TagSelect = ({
    options,
    selected,
    onChange,
    label
}: {
    options: string[],
    selected: string[],
    onChange: (vals: string[]) => void,
    label: string
}) => {
    const toggle = (val: string) => {
        if (val === 'ALL') {
            onChange(['ALL'])
            return
        }

        let newSelected = selected.filter(s => s !== 'ALL')
        if (newSelected.includes(val)) {
            newSelected = newSelected.filter(s => s !== val)
            if (newSelected.length === 0) newSelected = ['ALL']
        } else {
            newSelected = [...newSelected, val]
        }
        onChange(newSelected)
    }

    return (
        <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '12px', color: 'var(--muted-foreground)' }}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                    type="button"
                    onClick={() => toggle('ALL')}
                    style={{
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: selected.includes('ALL') ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                        color: selected.includes('ALL') ? 'black' : 'white',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                >
                    ALL
                </button>
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '100px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            border: '1px solid var(--border)',
                            background: selected.includes(opt) ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                            color: selected.includes(opt) ? 'black' : 'white',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function CollegeAdminDashboard() {
    const [activeTab, setActiveTab] = useState<'events' | 'clubs' | 'settings' | 'students'>('events')
    const [events, setEvents] = useState<any[]>([])
    const [clubs, setClubs] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [analytics, setAnalytics] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [collegeId, setCollegeId] = useState<string | null>(null)
    const [showScanner, setShowScanner] = useState(false)

    // Modals state
    const [showCreateEvent, setShowCreateEvent] = useState(false)
    const [showCreateClub, setShowCreateClub] = useState(false)
    const [showIssuePass, setShowIssuePass] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [targetCourses, setTargetCourses] = useState<string[]>(['ALL'])
    const [targetYears, setTargetYears] = useState<string[]>(['ALL'])
    const [targetBatches, setTargetBatches] = useState<string[]>(['ALL'])
    const [isIssuing, setIsIssuing] = useState(false)
    const [collegeData, setCollegeData] = useState<any>(null)

    // Club Form state
    const [clubName, setClubName] = useState('')
    const [clubHead, setClubHead] = useState('')
    const [clubContact, setClubContact] = useState('')
    const [clubLogo, setClubLogo] = useState('')
    const [isCreatingClub, setIsCreatingClub] = useState(false)

    // Event Form state
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [date, setDate] = useState('')
    const [loc, setLoc] = useState('')
    const [selectedClub, setSelectedClub] = useState('')
    const [brochureUrl, setBrochureUrl] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [capacity, setCapacity] = useState('0')
    const [isCreatingEvent, setIsCreatingEvent] = useState(false)
    const [editingEventId, setEditingEventId] = useState<string | null>(null)

    // Settings State
    const [domain, setDomain] = useState('')
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchInitialData()
    }, [])

    async function fetchInitialData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('college_id')
            .eq('id', user.id)
            .single()

        if (profile?.college_id) {
            setCollegeId(profile.college_id)
            const [eventsData, clubsData, collegeRes, stats, stds, passesData] = await Promise.all([
                supabase.from('events').select('*, clubs(*)').eq('college_id', profile.college_id).order('created_at', { ascending: false }),
                getClubs(profile.college_id),
                supabase.from('colleges').select('*').eq('id', profile.college_id).single(),
                getCollegeAnalytics(profile.college_id),
                getStudents(profile.college_id),
                supabase.from('passes').select('event_id').eq('status', 'used')
            ])

            if (eventsData.data) {
                const eventsWithCounts = eventsData.data.map((event: any) => ({
                    ...event,
                    scannedCount: passesData.data?.filter((p: any) => p.event_id === event.id).length || 0
                }))
                setEvents(eventsWithCounts)
            }
            if (clubsData) setClubs(clubsData)
            setAnalytics(stats)
            setStudents(stds)
            if (collegeRes.data) {
                setCollegeData(collegeRes.data)
                setDomain(collegeRes.data.email_domain || '')
            }

            // Real-time subscription for live attendance
            const channel = supabase
                .channel('admin-live-attendance')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'passes'
                }, (payload) => {
                    if (payload.new.status === 'used' && payload.old.status !== 'used') {
                        setEvents(currentEvents => currentEvents.map((ev: any) =>
                            ev.id === payload.new.event_id
                                ? { ...ev, scannedCount: (ev.scannedCount || 0) + 1 }
                                : ev
                        ))
                        // Also update analytics at the top
                        setAnalytics((prev: any) => ({
                            ...prev,
                            passesScanned: (prev?.passesScanned || 0) + 1
                        }))
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
        setLoading(false)
    }

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!collegeId) return
        setIsUpdatingSettings(true)

        const result = await updateCollege(collegeId, {
            email_domain: domain
        })

        if (result.success) {
            alert('Settings updated successfully!')
            fetchInitialData()
        } else {
            alert(result.error || 'Failed to update settings')
        }
        setIsUpdatingSettings(false)
    }

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!collegeId) return
        setIsCreatingClub(true)

        const result = await createClub({
            name: clubName,
            headName: clubHead,
            contactDetails: clubContact,
            logoUrl: clubLogo || undefined,
            collegeId: collegeId
        })

        if (result.success) {
            setClubName('')
            setClubHead('')
            setClubContact('')
            setClubLogo('')
            setShowCreateClub(false)
            const updatedClubs = await getClubs(collegeId)
            setClubs(updatedClubs)
        }
        setIsCreatingClub(false)
    }

    const handleDeleteClub = async (id: string) => {
        if (!confirm('Are you sure? All events linked to this club will lose thier reference.')) return
        const result = await deleteClub(id)
        if (result.success && collegeId) {
            const updatedClubs = await getClubs(collegeId)
            setClubs(updatedClubs)
        }
    }

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!collegeId) return
        setIsCreatingEvent(true)

        const { data: { user } } = await supabase.auth.getUser()

        const eventData = {
            title,
            description: desc,
            event_date: date,
            location: loc,
            club_id: selectedClub || null,
            brochure_url: brochureUrl || null,
            images: imageUrl ? [imageUrl] : [],
            college_id: collegeId,
            organizer_id: user?.id,
            is_published: true,
            max_capacity: parseInt(capacity) || 0
        }

        if (editingEventId) {
            const result = await updateEvent(editingEventId, eventData)
            if (result.success) {
                setShowCreateEvent(false)
                setEditingEventId(null)
                fetchInitialData()
            }
        } else {
            const { error } = await supabase.from('events').insert(eventData)
            if (!error) {
                setShowCreateEvent(false)
                fetchInitialData()
            }
        }

        setTitle('')
        setDesc('')
        setDate('')
        setLoc('')
        setSelectedClub('')
        setBrochureUrl('')
        setImageUrl('')
        setCapacity('0')
        setIsCreatingEvent(false)
    }

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event? This will also invalidate all issued passes.')) return
        const result = await deleteEvent(id)
        if (result.success) {
            fetchInitialData()
        }
    }

    const openEditEventModal = (event: any) => {
        setEditingEventId(event.id)
        setTitle(event.title)
        setDesc(event.description)
        setDate(new Date(event.event_date).toISOString().slice(0, 16))
        setLoc(event.location)
        setSelectedClub(event.club_id || '')
        setBrochureUrl(event.brochure_url || '')
        setImageUrl(event.images?.[0] || '')
        setCapacity(event.max_capacity?.toString() || '0')
        setShowCreateEvent(true)
    }

    const handleIssuePasses = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEvent || !collegeId) return
        setIsIssuing(true)

        const result = await issuePasses({
            eventId: selectedEvent.id,
            collegeId: collegeId,
            targetCourses,
            targetYears,
            targetBatches
        })

        if (result.success) {
            alert(`Success! Digital passes issued to ${result.count} students via email.`)
            setShowIssuePass(false)
        } else {
            alert(result.error || 'Failed to issue passes')
        }
        setIsIssuing(false)
    }

    const openIssueModal = (event: any) => {
        setSelectedEvent(event)
        setTargetCourses(['ALL'])
        setTargetYears(['ALL'])
        setTargetBatches(['ALL'])
        setShowIssuePass(true)
    }

    return (
        <main style={{ padding: '160px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>College <span style={{ color: 'var(--primary)' }}>Admin</span></h1>
                    <p style={{ color: 'var(--muted-foreground)' }}>Manage your campus life from one dashboard.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={activeTab === 'events' ? 'button button-primary' : 'button button-outline'}
                    >
                        Events
                    </button>
                    <button
                        onClick={() => setActiveTab('clubs')}
                        className={activeTab === 'clubs' ? 'button button-primary' : 'button button-outline'}
                    >
                        Clubs
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={activeTab === 'students' ? 'button button-primary' : 'button button-outline'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Users size={18} /> Students
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={activeTab === 'settings' ? 'button button-primary' : 'button button-outline'}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Settings size={18} /> Settings
                    </button>
                </div>
            </header>

            {/* Analytics Summary */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '48px' }}>
                <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <GraduationCap size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Students</span>
                    </div>
                    <h2 style={{ fontSize: '2rem' }}>{analytics?.students || 0}</h2>
                </div>
                <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <BarChart3 size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Active Events</span>
                    </div>
                    <h2 style={{ fontSize: '2rem' }}>{analytics?.events || 0}</h2>
                </div>
                <div className="glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <Send size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Passes Issued</span>
                    </div>
                    <h2 style={{ fontSize: '2rem' }}>{analytics?.passesIssued || 0}</h2>
                </div>
                <div className="glass" style={{ padding: '24px', border: '1px solid rgba(237, 255, 102, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <CheckCircle size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Attendance</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '2rem' }}>{analytics?.passesScanned || 0}</h2>
                        <span style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                            {analytics?.passesIssued > 0 ? Math.round((analytics.passesScanned / analytics.passesIssued) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </section>

            {activeTab === 'events' && (
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>Upcoming Events</h2>
                        <button className="button button-primary" onClick={() => setShowCreateEvent(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> New Event
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {loading ? (
                            <Loader2 className="spinner" size={40} style={{ color: 'var(--primary)', gridColumn: '1/-1', margin: '40px auto' }} />
                        ) : events.length === 0 ? (
                            <div className="glass" style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1' }}>
                                <p style={{ color: 'var(--muted-foreground)' }}>No events created yet.</p>
                            </div>
                        ) : events.map((event: any) => (
                            <div key={event.id} className="glass animate-fade" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{
                                                padding: '4px 12px',
                                                borderRadius: '100px',
                                                backgroundColor: 'rgba(237, 255, 102, 0.1)',
                                                color: 'var(--primary)',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold'
                                            }}>
                                                {event.clubs?.name || 'GENERIC'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openEditEventModal(event)} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer', padding: '4px' }}>
                                                <MoreVertical size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteEvent(event.id)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '4px' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>{event.title}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Calendar size={16} /> {new Date(event.event_date).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <MapPin size={16} /> {event.location}
                                        </div>
                                    </div>

                                    {event.max_capacity > 0 && (
                                        <div style={{ marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px' }}>
                                                <span style={{ color: 'var(--muted-foreground)' }}>Day-of Attendance</span>
                                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{event.scannedCount} / {event.max_capacity}</span>
                                            </div>
                                            <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${Math.min(100, (event.scannedCount / event.max_capacity) * 100)}%`,
                                                    background: (event.scannedCount / event.max_capacity) < 0.5 ? '#edff66' : (event.scannedCount / event.max_capacity) < 0.8 ? '#ffb366' : '#ff6666',
                                                    transition: 'width 0.5s ease-out'
                                                }} />
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                                        <button
                                            className="button button-outline"
                                            onClick={() => openIssueModal(event)}
                                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}
                                        >
                                            <Send size={14} /> issue passes
                                        </button>
                                        {event.brochure_url && (
                                            <a href={event.brochure_url} target="_blank" className="button button-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                                                <LinkIcon size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {activeTab === 'clubs' && (
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>Managed Clubs</h2>
                        <button className="button button-primary" onClick={() => setShowCreateClub(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> New Club
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {clubs.map((club: any) => (
                            <div key={club.id} className="glass animate-fade" style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--border)',
                                        overflow: 'hidden'
                                    }}>
                                        <img src={club.logo_url} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '1.1rem' }}>{club.name}</h3>
                                        <p style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600' }}>{club.head_name}</p>
                                    </div>
                                    <button onClick={() => handleDeleteClub(club.id)} style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', padding: '8px' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="glass" style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.01)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={14} />
                                        {club.contact_details || 'No contact provided'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {activeTab === 'students' && (
                <section className="animate-fade">
                    <div className="glass" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>Student Roster</h2>
                            <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>{students.length} Registered Students</div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        <th style={{ padding: '16px' }}>Full Name</th>
                                        <th style={{ padding: '16px' }}>Email</th>
                                        <th style={{ padding: '16px' }}>Course</th>
                                        <th style={{ padding: '16px' }}>Year</th>
                                        <th style={{ padding: '16px' }}>Batch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No students registered yet.</td>
                                        </tr>
                                    ) : students.map((s: any) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '16px', fontWeight: 'bold' }}>{s.full_name}</td>
                                            <td style={{ padding: '16px', color: 'var(--muted-foreground)' }}>{s.email}</td>
                                            <td style={{ padding: '16px' }}>{s.course}</td>
                                            <td style={{ padding: '16px' }}>{s.year}</td>
                                            <td style={{ padding: '16px' }}>{s.batch}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'settings' && (
                <section className="animate-fade">
                    <div className="glass" style={{ maxWidth: '600px', padding: '40px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Institution Settings</h2>
                        <form onSubmit={handleUpdateSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>
                                    Official Email Domain
                                </label>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>
                                    Only students with an email ending in this domain can sign up.
                                    (e.g., <span style={{ color: 'var(--primary)' }}>iitb.ac.in</span> or <span style={{ color: 'var(--primary)' }}>polariscampus.com</span>)
                                </p>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }}>@</span>
                                    <input
                                        value={domain}
                                        onChange={e => setDomain(e.target.value)}
                                        placeholder="domain.com"
                                        required
                                        className="glass"
                                        style={{
                                            width: '100%',
                                            padding: '12px 12px 12px 35px',
                                            background: 'none',
                                            border: '1px solid var(--border)',
                                            color: 'white',
                                            borderRadius: '10px'
                                        }}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={isUpdatingSettings} className="button button-primary" style={{ height: '50px' }}>
                                {isUpdatingSettings ? <Loader2 className="spinner" size={20} /> : 'Save Settings'}
                            </button>
                        </form>

                        <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(237, 255, 102, 0.05)', borderRadius: '12px', border: '1px solid rgba(237, 255, 102, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px' }}>Why is this important?</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: '1.5' }}>
                                        This domain acts as a whitelist for student verification. When a student tries to sign up, the system checks if their email matches this domain. This prevents outsiders from accessing your college-specific events and passes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Create Club Modal */}
            {showCreateClub && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass animate-fade" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative' }}>
                        <button onClick={() => setShowCreateClub(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '24px' }}>Register New Club</h2>
                        <form onSubmit={handleCreateClub} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Club Name</label>
                                <input value={clubName} onChange={e => setClubName(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Club Head Name</label>
                                <input value={clubHead} onChange={e => setClubHead(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Contact Details (Email/Phone)</label>
                                <input value={clubContact} onChange={e => setClubContact(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Logo URL (Optional)</label>
                                <input value={clubLogo} onChange={e => setClubLogo(e.target.value)} placeholder="https://..." className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                            </div>
                            <button type="submit" disabled={isCreatingClub} className="button button-primary" style={{ width: '100%', height: '50px' }}>
                                {isCreatingClub ? <Loader2 className="spinner" size={20} /> : 'Create Club'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {showCreateEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass animate-fade" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative' }}>
                        <button onClick={() => { setShowCreateEvent(false); setEditingEventId(null); }} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '24px' }}>{editingEventId ? 'Edit Event' : 'Create New Event'}</h2>
                        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Event Title</label>
                                    <input value={title} onChange={e => setTitle(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Select Club</label>
                                    <select value={selectedClub} onChange={e => setSelectedClub(e.target.value)} className="glass" style={{ width: '100%', padding: '12px', background: 'rgba(10,10,11,1)', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }}>
                                        <option value="">No Club (Generic)</option>
                                        {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Description</label>
                                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px', resize: 'none' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Date & Time</label>
                                    <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Location</label>
                                    <input value={loc} onChange={e => setLoc(e.target.value)} required className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Image URL</label>
                                    <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Brochure Link</label>
                                    <input value={brochureUrl} onChange={e => setBrochureUrl(e.target.value)} placeholder="https://..." className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Venue Capacity</label>
                                    <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. 500" className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--muted-foreground)' }}>Tracking Type</label>
                                    <div className="glass" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        PERCENTAGE MODE
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={isCreatingEvent} className="button button-primary" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
                                {isCreatingEvent ? <Loader2 className="spinner" size={20} /> : (editingEventId ? 'Update Event' : 'Launch Event')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Floating Scanner Button */}
            <button
                onClick={() => setShowScanner(true)}
                className="button button-primary animate-fade"
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    right: '32px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(237, 255, 102, 0.4)',
                    zIndex: 1000
                }}
            >
                <QrCode size={28} />
            </button>

            {showScanner && (
                <Scanner onClose={() => setShowScanner(false)} />
            )}

            {/* Issue Passes Modal */}
            {showIssuePass && selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="glass animate-fade" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative' }}>
                        <button onClick={() => setShowIssuePass(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(237, 255, 102, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Send size={28} />
                            </div>
                            <h2 style={{ marginBottom: '8px' }}>Issue Passes</h2>
                            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>{selectedEvent.title}</p>
                        </div>

                        <form onSubmit={handleIssuePasses} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <TagSelect
                                label="Target Courses"
                                options={collegeData?.courses || []}
                                selected={targetCourses}
                                onChange={setTargetCourses}
                            />

                            <TagSelect
                                label="Target Years"
                                options={collegeData?.years || []}
                                selected={targetYears}
                                onChange={setTargetYears}
                            />

                            <TagSelect
                                label="Target Batches"
                                options={collegeData?.batches || ["2021", "2022", "2023", "2024", "2025"]}
                                selected={targetBatches}
                                onChange={setTargetBatches}
                            />

                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
                                <Info size={14} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                Passes will be automatically generated and sent to students' registered emails.
                            </div>

                            <button type="submit" disabled={isIssuing} className="button button-primary" style={{ width: '100%', height: '52px' }}>
                                {isIssuing ? <Loader2 className="spinner" size={20} /> : 'Distribute Passes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    )
}
