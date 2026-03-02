import { Ticket, Calendar, MapPin, Search } from 'lucide-react'
import Link from 'next/link'

const MOCK_EVENTS = [
    { id: 1, name: 'Aditva Global Summit', date: 'March 15, 2026', location: 'Tech Plaza, Mumbai', price: '₹4,999', category: 'Tech' },
    { id: 2, name: 'Neon Nights Concert', date: 'April 02, 2026', location: 'Open Air Arena', price: '₹2,499', category: 'Music' },
    { id: 3, name: 'Design Masters Workshop', date: 'April 20, 2026', location: 'Creative Space', price: '₹1,999', category: 'Design' },
    { id: 4, name: 'Startup Pitch Day', date: 'May 05, 2026', location: 'Venture Hub', price: 'Free', category: 'Business' },
]

export default function EventsPage() {
    return (
        <main style={{ padding: '160px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>Upcoming <span style={{ color: 'var(--primary)' }}>Events</span></h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Secure your pass for the most exclusive events in town.</p>

                <div className="glass" style={{
                    maxWidth: '600px',
                    margin: '40px auto 0',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    gap: '12px'
                }}>
                    <Search size={20} style={{ color: 'var(--muted-foreground)' }} />
                    <input
                        type="text"
                        placeholder="Search events, categories, or locations..."
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
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
                {MOCK_EVENTS.map(event => (
                    <div key={event.id} className="glass animate-fade" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{
                            height: '200px',
                            background: 'linear-gradient(135deg, #1e1e20 0%, #141416 100%)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            opacity: 0.8
                        }}>
                            <Ticket size={48} />
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                marginBottom: '12px'
                            }}>
                                {event.category}
                            </div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '20px' }}>{event.name}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                    <Calendar size={14} />
                                    {event.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                                    <MapPin size={14} />
                                    {event.location}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{event.price}</span>
                                <Link href={`/event/${event.id}`} className="button button-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                    Get Pass
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    )
}
