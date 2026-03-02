import { MoveRight, Sparkles, ShieldCheck, Zap, Ticket, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let collegeEvents: any[] = [];

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*, colleges(*)')
      .eq('id', user.id)
      .single();
    profile = p;

    if (p?.college_id) {
      const { data: evs } = await supabase
        .from('events')
        .select('*, clubs(*)')
        .eq('college_id', p.college_id)
        .order('event_date', { ascending: true })
        .limit(3);
      collegeEvents = evs || [];
    }
  }

  return (
    <main style={{ padding: '160px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Section */}
      <section className="animate-fade" style={{ textAlign: 'center', marginBottom: '100px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          backgroundColor: 'rgba(237, 255, 102, 0.1)',
          color: 'var(--primary)',
          borderRadius: '100px',
          fontSize: '0.85rem',
          fontWeight: '600',
          marginBottom: '24px'
        }}>
          <Sparkles size={14} />
          {user ? `Welcome back, ${profile?.full_name || 'User'} from ${profile?.colleges?.name || 'your college'}` : 'Digital Passes Made Simple'}
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', marginBottom: '24px', lineHeight: '1.1' }}>
          {user ? (
            <>READY FOR YOUR<br /><span style={{ color: 'var(--primary)' }}>NEXT PASS?</span></>
          ) : (
            <>DISTRIBUTE <span style={{ color: 'var(--primary)' }}>PASSES</span><br />WITH CONFIDENCE.</>
          )}
        </h1>

        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          {user
            ? `Stay updated with the latest happenings at ${profile?.colleges?.name || 'college'}. Explore and manage your event passes.`
            : "Secure, fast, and elegant ticket distribution for your premium events. Manage everything from one dashboard."
          }
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/dashboard" className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user ? 'Open Wallet' : 'Get Started'} <MoveRight size={18} />
          </Link>
          {!user && (
            <Link href="/auth" className="button button-outline">
              Join College
            </Link>
          )}
        </div>
      </section>

      {/* Feature Grid - Only show if not logged in */}
      {!user && (
        <section className="animate-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '100px' }}>
          <div className="glass" style={{ padding: '32px' }}>
            <ShieldCheck size={32} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Secure QR Codes</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>Indestructible digital signatures ensure every pass is authentic and single-use.</p>
          </div>
          <div className="glass" style={{ padding: '32px' }}>
            <Zap size={32} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Instant Delivery</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>Send passes via email or WhatsApp in seconds. No more physical printing delays.</p>
          </div>
          <div className="glass" style={{ padding: '32px' }}>
            <Ticket size={32} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Smart Wallet</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>Students keep all their event passes in one high-performance digital wallet.</p>
          </div>
        </section>
      )}

      {/* Events Section */}
      <section className="animate-fade">
        <h2 style={{ marginBottom: '40px', textAlign: 'center', fontSize: '2.5rem' }}>{user ? 'Upcoming Campus Events' : 'Featured Events'}</h2>

        {collegeEvents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
            {collegeEvents.map(event => (
              <div key={event.id} className="glass" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {event.images?.[0] ? (
                  <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                    <img src={event.images[0]} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: '200px', width: '100%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ticket size={48} style={{ opacity: 0.1 }} />
                  </div>
                )}
                <div style={{ padding: '32px' }}>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                    {event.clubs?.name || 'General Event'}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{event.title}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '24px' }}>
                    <p style={{ marginBottom: '4px' }}>📅 {new Date(event.event_date).toLocaleDateString()}</p>
                    <p>📍 {event.location}</p>
                  </div>
                  <Link href={`/events/${event.id}`} className="button button-outline" style={{ width: '100%', textAlign: 'center' }}>
                    More Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass" style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
            <p style={{ color: 'var(--muted-foreground)' }}>No upcoming events scheduled at the moment.</p>
          </div>
        )}
      </section>
    </main>
  );
}
