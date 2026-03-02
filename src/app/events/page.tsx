import { Ticket, Calendar, MapPin, Search } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function EventsPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q = '' } = await searchParams
    const supabase = await createClient()

    let query = supabase
        .from('events')
        .select('*, clubs(*)')
        .eq('is_published', true)
        .order('event_date', { ascending: true })

    if (q) {
        query = query.ilike('title', `%${q}%`)
    }

    const { data: events } = await query

    // Fetch attendance for these events to show rough status
    const eventIds = events?.map((e: any) => e.id) || []
    const { data: passes } = await supabase.from('passes').select('event_id').eq('status', 'used').in('event_id', eventIds)

    const eventsWithStatus = events?.map((event: any) => {
        const scannedCount = passes?.filter((p: any) => p.event_id === event.id).length || 0;
        const capacity = event.max_capacity || 0;
        const occupancy = capacity > 0 ? (scannedCount / capacity) : 0;

        let statusLabel = '';
        let statusColor = 'var(--primary)';

        if (capacity > 0) {
            if (occupancy < 0.3) statusLabel = 'Plenty of Space';
            else if (occupancy < 0.6) { statusLabel = 'Filling Up'; statusColor = '#edff66'; }
            else if (occupancy < 0.9) { statusLabel = 'Near Capacity'; statusColor = '#ffb366'; }
            else { statusLabel = 'Sold Out/Full'; statusColor = '#ff6666'; }
        }

        return { ...event, statusLabel, statusColor };
    }) || []

    async function handleSearch(formData: FormData) {
        'use server'
        const searchTerm = formData.get('q')
        if (searchTerm !== null) {
            redirect(`/events?q=${encodeURIComponent(searchTerm.toString())}`)
        }
    }

    return (
        <main style={{ padding: '160px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Upcoming <span style={{ color: 'var(--primary)' }}>Events</span></h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Secure your pass for the most exclusive events in town.</p>

                <form action={handleSearch} className="glass" style={{
                    maxWidth: '600px',
                    margin: '40px auto 0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    gap: '12px'
                }}>
                    <Search size={20} style={{ color: 'var(--muted-foreground)' }} />
                    <input
                        name="q"
                        type="text"
                        placeholder="Search events, clubs, or locations..."
                        defaultValue={q}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            width: '100%',
                            padding: '12px 0',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />
                    <button type="submit" style={{ display: 'none' }}>Search</button>
                </form>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                {!events || events.length === 0 ? (
                    <div className="glass" style={{ padding: '60px', textAlign: 'center', gridColumn: '1/-1' }}>
                        <p style={{ color: 'var(--muted-foreground)' }}>{q ? `No events found for "${q}"` : 'No live events found at the moment.'}</p>
                    </div>
                ) : eventsWithStatus.map(event => (
                    <div key={event.id} className="glass animate-fade" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {event.statusLabel && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(10px)',
                                padding: '4px 12px',
                                borderRadius: '100px',
                                border: `1px solid ${event.statusColor}`,
                                color: event.statusColor,
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                zIndex: 1,
                                letterSpacing: '0.05em'
                            }}>
                                {event.statusLabel}
                            </div>
                        )}
                        <div style={{
                            height: '200px',
                            background: event.images?.[0] ? `url(${event.images[0]})` : 'linear-gradient(135deg, #1e1e20 0%, #141416 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            opacity: 0.8
                        }}>
                            {!event.images?.[0] && <Ticket size={48} />}
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                marginBottom: '12px'
                            }}>
                                {event.clubs?.name || 'GENERAL'}
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>{event.title}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                    <Calendar size={14} />
                                    {new Date(event.event_date).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                    <MapPin size={14} />
                                    {event.location}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{event.price === 0 ? 'FREE' : `₹${event.price}`}</span>
                                <Link href={`/events/${event.id}`} className="button button-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                    More Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
