'use client'

import { useEffect, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { scanPass } from '@/app/actions/admin-actions'
import { createClient } from '@/utils/supabase/client'

interface ScannerProps {
    onClose: () => void
}

export default function Scanner({ onClose }: ScannerProps) {
    const [scanResult, setScanResult] = useState<{ success: boolean; message: string; eventName?: string } | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
      /* verbose= */ false
        )

        scanner.render(onScanSuccess, onScanFailure)

        async function onScanSuccess(decodedText: string) {
            if (isProcessing) return

            setIsProcessing(true)
            scanner.pause() // Pause scanning while processing

            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) throw new Error('Unauthorized')

                const result = await scanPass(decodedText, user.id)

                if (result.success) {
                    setScanResult({
                        success: true,
                        message: 'ENTRY GRANTED',
                        eventName: result.data?.eventName
                    })
                    // Auto clear result and resume after 3 seconds
                    setTimeout(() => {
                        setScanResult(null)
                        scanner.resume()
                        setIsProcessing(false)
                    }, 3000)
                } else {
                    setScanResult({
                        success: false,
                        message: result.error || 'INVALID PASS'
                    })
                    setTimeout(() => {
                        setScanResult(null)
                        scanner.resume()
                        setIsProcessing(false)
                    }, 3000)
                }
            } catch (err) {
                setScanResult({ success: false, message: 'SCAN ERROR' })
                setTimeout(() => {
                    setScanResult(null)
                    scanner.resume()
                    setIsProcessing(false)
                }, 3000)
            }
        }

        function onScanFailure(error: any) {
            // Ignore failures, we just keep looking
        }

        return () => {
            scanner.clear().catch(e => console.error('Failed to clear scanner', e))
        }
    }, [])

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
        }}>
            <button
                onClick={onClose}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white' }}
            >
                <X size={32} />
            </button>

            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ color: 'white', marginBottom: '8px' }}>Scan Entry Pass</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', fontSize: '0.9rem' }}>Align the QR code within the frame</p>

                <div id="reader" style={{ borderRadius: '20px', overflow: 'hidden', border: 'none' }}></div>

                {scanResult && (
                    <div className="animate-fade" style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '280px',
                        padding: '32px',
                        borderRadius: '24px',
                        backgroundColor: scanResult.success ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
                        color: 'white',
                        backdropFilter: 'blur(10px)',
                        textAlign: 'center',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        zIndex: 100
                    }}>
                        {scanResult.success ? (
                            <CheckCircle2 size={64} style={{ margin: '0 auto 16px' }} />
                        ) : (
                            <AlertCircle size={64} style={{ margin: '0 auto 16px' }} />
                        )}
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>{scanResult.message}</h1>
                        {scanResult.eventName && (
                            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>{scanResult.eventName}</p>
                        )}
                    </div>
                )}

                {isProcessing && !scanResult && (
                    <div style={{ marginTop: '24px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 className="spinner" size={20} />
                        Validating Pass...
                    </div>
                )}
            </div>

            <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader video {
          border-radius: 20px;
        }
        #reader__dashboard_section_csr button {
          background: var(--primary) !important;
          color: black !important;
          border-radius: 10px !important;
          border: none !important;
          padding: 8px 16px !important;
          font-weight: bold !important;
          margin-top: 10px !important;
        }
        #reader__status_span {
            display: none !important;
        }
      `}</style>
        </div>
    )
}
