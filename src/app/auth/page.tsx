'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Mail, Lock, User, ArrowRight, Loader2,
    Building2, GraduationCap, ChevronLeft, CheckCircle2,
    ShieldCheck, AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getColleges } from '@/app/actions/admin-actions'

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [step, setStep] = useState(1) // Steps for Signup: 1: College, 2: Details, 3: Account, 4: OTP

    // App state
    const [colleges, setColleges] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form State
    const [selectedCollege, setSelectedCollege] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [course, setCourse] = useState('')
    const [year, setYear] = useState('')
    const [batch, setBatch] = useState('')
    const [otp, setOtp] = useState('')

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        fetchColleges()
    }, [])

    async function fetchColleges() {
        const data = await getColleges()
        setColleges(data)
    }

    const handleCollegeSelect = (college: any) => {
        setSelectedCollege(college)
        setStep(2)
    }

    const handleDetailsSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStep(3)
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        // Validate email domain
        if (selectedCollege && !email.endsWith(`@${selectedCollege.email_domain}`)) {
            setError(`Email must end with @${selectedCollege.email_domain}`)
            setLoading(false)
            return
        }

        const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    college_id: selectedCollege.id,
                    role: 'student',
                    course,
                    year,
                    degree: course, // Using course as degree for now
                    batch
                }
            }
        })

        if (signupError) {
            setError(signupError.message)
            setLoading(false)
        } else {
            setStep(4)
            setLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'signup'
        })

        if (verifyError) {
            setError(verifyError.message)
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (loginError) {
            setError(loginError.message)
        } else {
            router.push('/dashboard')
        }
        setLoading(false)
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="glass animate-fade auth-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', position: 'relative' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                        {isLogin ? 'Login to access your passes' : 'Join your college community'}
                    </p>
                </div>

                {isLogin ? (
                    /* LOGIN FORM */
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="email"
                                placeholder="College Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                className="auth-input"
                            />
                        </div>

                        {error && <div style={{ color: '#ff5555', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={14} /> {error}</div>}

                        <button className="button button-primary" type="submit" disabled={loading} style={{ height: '52px' }}>
                            {loading ? <Loader2 className="spinner" size={20} /> : 'Login'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                            Don't have an account? <span onClick={() => setIsLogin(false)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Sign Up</span>
                        </p>
                    </form>
                ) : (
                    /* SIGNUP MULTI-STEP */
                    <div>
                        {step > 1 && step < 4 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                style={{ position: 'absolute', left: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                        )}

                        {step === 1 && (
                            <div className="animate-fade">
                                <p style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: '600' }}>Select your college</p>
                                <div style={{ display: 'grid', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                                    {colleges.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => handleCollegeSelect(c)}
                                            className="glass"
                                            style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', border: selectedCollege?.id === c.id ? '1px solid var(--primary)' : '1px solid var(--border)' }}
                                        >
                                            <Building2 size={18} style={{ color: 'var(--primary)' }} />
                                            <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleDetailsSubmit} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required className="auth-input" />
                                </div>
                                <div className="responsive-grid" style={{ display: 'grid', gap: '16px' }}>
                                    <select value={course} onChange={e => setCourse(e.target.value)} required className="auth-input" style={{ paddingLeft: '12px' }}>
                                        <option value="">Course</option>
                                        {selectedCollege.courses.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select value={year} onChange={e => setYear(e.target.value)} required className="auth-input" style={{ paddingLeft: '12px' }}>
                                        <option value="">Year</option>
                                        {selectedCollege.years.map((y: string) => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <input placeholder="Batch / Division" value={batch} onChange={e => setBatch(e.target.value)} required className="auth-input" />

                                <button className="button button-primary" type="submit" style={{ height: '52px', marginTop: '8px' }}>
                                    Next Step <ArrowRight size={18} />
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleSignup} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ padding: '12px', background: 'rgba(237, 255, 102, 0.05)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <ShieldCheck size={16} /> Verifying for {selectedCollege?.name}
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>College Email (@{selectedCollege?.email_domain})</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                        <input
                                            type="email"
                                            placeholder={`username@${selectedCollege?.email_domain}`}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                            className="auth-input"
                                        />
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
                                    <input
                                        type="password"
                                        placeholder="Create Password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        className="auth-input"
                                    />
                                </div>

                                {error && <div style={{ color: '#ff5555', fontSize: '0.8rem' }}>{error}</div>}

                                <button className="button button-primary" type="submit" disabled={loading} style={{ height: '52px' }}>
                                    {loading ? <Loader2 className="spinner" size={20} /> : 'Send OTP'}
                                </button>
                            </form>
                        )}

                        {step === 4 && (
                            <form onSubmit={handleVerifyOtp} className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
                                <div>
                                    <h3 style={{ marginBottom: '8px' }}>Check your mail</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>We've sent a 6-digit code to {email}</p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <input
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="000000"
                                        maxLength={6}
                                        style={{
                                            width: '100%',
                                            textAlign: 'center',
                                            letterSpacing: '8px',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            padding: '16px',
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '12px',
                                            color: 'white'
                                        }}
                                    />
                                </div>
                                {error && <div style={{ color: '#ff5555', fontSize: '0.8rem' }}>{error}</div>}
                                <button className="button button-primary" type="submit" disabled={loading} style={{ height: '52px' }}>
                                    {loading ? <Loader2 className="spinner" size={20} /> : 'Verify & Continue'}
                                </button>
                            </form>
                        )}

                        {step < 4 && (
                            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--muted-foreground)', marginTop: '24px' }}>
                                Already have an account? <span onClick={() => setIsLogin(true)} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}>Login</span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}
