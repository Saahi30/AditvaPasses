'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, Users, Building2, Loader2, ArrowRight, X, Mail, Lock, User, ShieldCheck } from 'lucide-react'
import { createCollegeAdmin, getCollegeAdmins, createCollege, getColleges } from '@/app/actions/admin-actions'

export default function SuperAdminDashboard() {
    const [colleges, setColleges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [activeCollege, setActiveCollege] = useState<any>(null)
    const [collegeAdmins, setCollegeAdmins] = useState<any[]>([])

    const [name, setName] = useState('')
    const [emailDomain, setEmailDomain] = useState('')
    const [courses, setCourses] = useState('')
    const [years, setYears] = useState('1st,2nd,3rd,4th')

    // New Admin state
    const [adminEmail, setAdminEmail] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [adminName, setAdminName] = useState('')
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)
    const [adminError, setAdminError] = useState('')

    const supabase = createClient()

    useEffect(() => {
        fetchColleges()
    }, [])

    async function fetchColleges() {
        const data = await getColleges()
        setColleges(data)
        setLoading(false)
    }

    async function handleOpenAdmins(college: any) {
        setActiveCollege(college)
        setCollegeAdmins([])
        const admins = await getCollegeAdmins(college.id)
        setCollegeAdmins(admins)
    }

    const handleAddCollege = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const courseList = courses.split(',').map(c => c.trim())
        const yearList = years.split(',').map(y => y.trim())

        const result = await createCollege({
            name,
            email_domain: emailDomain,
            courses: courseList,
            years: yearList
        })

        if (result.success) {
            setName('')
            setEmailDomain('')
            setCourses('')
            setShowAdd(false)
            fetchColleges()
        }
        setLoading(false)
    }

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreatingAdmin(true)
        setAdminError('')

        const result = await createCollegeAdmin({
            email: adminEmail,
            password: adminPassword,
            fullName: adminName,
            collegeId: activeCollege.id
        })

        if (result.success) {
            setAdminEmail('')
            setAdminPassword('')
            setAdminName('')
            const admins = await getCollegeAdmins(activeCollege.id)
            setCollegeAdmins(admins)
        } else {
            setAdminError(result.error || 'Failed to create admin')
        }
        setIsCreatingAdmin(false)
    }

    return (
        <main style={{ padding: '160px 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{
                        color: 'var(--primary)',
                        fontWeight: '900',
                        fontSize: '0.75rem',
                        marginBottom: '12px',
                        letterSpacing: '0.15em',
                        padding: '6px 12px',
                        background: 'rgba(237, 255, 102, 0.1)',
                        width: 'max-content',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                    }}>
                        Global Orchestration
                    </div>
                    <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em' }}>Managed <span style={{ color: 'var(--primary)' }}>Tenants</span></h1>
                </div>
                <button className="button button-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Add College
                </button>
            </header>

            {showAdd && (
                <section className="glass animate-fade" style={{ padding: '32px', marginBottom: '48px' }}>
                    <h3 style={{ marginBottom: '24px' }}>Register New College</h3>
                    <form onSubmit={handleAddCollege} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>College Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. St. Xavier's Mumbai" className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Email Domain (e.g. mit.edu)</label>
                            <input value={emailDomain} onChange={e => setEmailDomain(e.target.value)} required placeholder="mit.edu" className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Courses (Comma separated)</label>
                            <input value={courses} onChange={e => setCourses(e.target.value)} required placeholder="B.Tech, BCA, B.Com" className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Years</label>
                            <input value={years} onChange={e => setYears(e.target.value)} required placeholder="1st, 2nd, 3rd, 4th" className="glass" style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border)', color: 'white', borderRadius: '10px' }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                            <button type="submit" className="button button-primary" disabled={loading} style={{ flex: 1 }}>{loading ? <Loader2 className="spinner" size={18} /> : 'Save College'}</button>
                            <button type="button" className="button button-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                        </div>
                    </form>
                </section>
            )}

            {loading && colleges.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px' }}><Loader2 className="spinner" size={40} style={{ color: 'var(--primary)' }} /></div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {colleges.map(college => (
                        <div key={college.id} className="glass animate-fade" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(237, 255, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Building2 size={24} style={{ color: 'var(--primary)' }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{college.name}</h3>
                                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                                        {college.courses.length} courses • {college.years.join(', ')}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => handleOpenAdmins(college)}
                                    className="button button-outline"
                                    style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Users size={14} /> Manage Admins
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Admin Management Modal */}
            {activeCollege && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div className="glass animate-fade" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', position: 'relative' }}>
                        <button
                            onClick={() => setActiveCollege(null)}
                            style={{ position: 'absolute', right: '24px', top: '24px', background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ marginBottom: '8px' }}>{activeCollege.name}</h2>
                        <p style={{ color: 'var(--muted-foreground)', marginBottom: '32px' }}>Manage administrators for this college.</p>

                        <section style={{ marginBottom: '40px' }}>
                            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Active Administrators</h4>
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {collegeAdmins.length === 0 ? (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>No admins assigned yet.</p>
                                ) : collegeAdmins.map(admin => (
                                    <div key={admin.id} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{admin.full_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{admin.role}</div>
                                        </div>
                                        <div style={{ color: 'var(--primary)' }}>
                                            <ShieldCheck size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Add New Administrator</h4>
                            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input value={adminName} onChange={e => setAdminName(e.target.value)} required placeholder="Full Name" style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required placeholder="Email Address" style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required placeholder="Initial Password" style={{ width: '100%', padding: '12px 16px 12px 48px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'white', borderRadius: '12px', outline: 'none' }} />
                                </div>

                                {adminError && <p style={{ color: '#ff5555', fontSize: '0.8rem' }}>{adminError}</p>}

                                <button type="submit" disabled={isCreatingAdmin} className="button button-primary" style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    {isCreatingAdmin ? <Loader2 className="spinner" size={18} /> : (
                                        <>
                                            <User size={18} /> Create Admin
                                        </>
                                    )}
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            )}
        </main>
    )
}
