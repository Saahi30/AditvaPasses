import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If variables are missing (e.g. during build/prerendering on Vercel),
    // we provide fallback strings to prevent the build from crashing.
    if (!supabaseUrl || !supabaseAnonKey) {
        return createBrowserClient(
            supabaseUrl || 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
