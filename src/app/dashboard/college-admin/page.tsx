'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Plus, Ticket, QrCode, Filter, MoreVertical, Loader2,
    Calendar, MapPin, CheckCircle2, Users, Building2,
    Trash2, Image as ImageIcon, Link as LinkIcon, Info, X,
    Send
} from 'lucide-react'
import { createClub, getClubs, deleteClub, issuePasses } from '@/app/actions/admin-actions'
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
    const [activeTab, setActiveTab] = useState<'events' | 'clubs'>('events')
    const [events, setEvents] = useState<any[]>([])
    const [clubs, setClubs] = useState<any[]>([])
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
    const [imageUrl, setImageUrl] = useState('') // Just one for now for simplicity in UI
    const [isCreatingEvent, setIsCreatingEvent] = useState(false)

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
            const [eventsData, clubsData, collegeRes] = await Promise.all([
                supabase.from('events').select('*, clubs(*)').eq('college_id', profile.college_id).order('created_at', { ascending: false }),
                getClubs(profile.college_id),
                supabase.from('colleges').select('*').eq('id', profile.college_id).single()
            ])

            if (eventsData.data) setEvents(eventsData.data)
            if (clubsData) setClubs(clubsData)
            if (collegeRes.data) setCollegeData(collegeRes.data)
        }
        setLoading(false)
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

        const { error } = await supabase.from('events').insert({
            title,
            description: desc,
            event_date: date,
            location: loc,
            club_id: selectedClub || null,
            brochure_url: brochureUrl || null,
            images: imageUrl ? [imageUrl] : [],
            college_id: collegeId,
            organizer_id: user?.id,
            is_published: true
        })

        if (!error) {
            setTitle('')
            setDesc('')
            setDate('')
            setLoc('')
            setSelectedClub('')
            setBrochureUrl('')
            setImageUrl('')
            setShowCreateEvent(false)
            fetchInitialData()
        }
        setIsCreatingEvent(false)
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
                </div>
            </header>

            {activeTab === 'events' ? (
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
                        ) : events.map(event => (
                            <div key={event.id} className="glass animate-fade" style={{ overflow: 'hidden' }}>
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
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

                                    <h3 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>{event.title}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Calendar size={16} /> {new Date(event.event_date).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <MapPin size={16} /> {event.location}
                                        </div>
                                    </div>

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
            ) : (
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>Managed Clubs</h2>
                        <button className="button button-primary" onClick={() => setShowCreateClub(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> New Club
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                        {clubs.map(club => (
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
                        <button onClick={() => setShowCreateEvent(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        <h2 style={{ marginBottom: '24px' }}>Create New Event</h2>
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

                            <button type="submit" disabled={isCreatingEvent} className="button button-primary" style={{ width: '100%', height: '50px', marginTop: '10px' }}>
                                {isCreatingEvent ? <Loader2 className="spinner" size={20} /> : 'Launch Event'}
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
