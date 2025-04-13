import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token',
    flowType: 'pkce',
  },
})

// Server-side Supabase client with service role key for admin access
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Helper function to check if we're in a password reset flow
export const isPasswordResetFlow = () => {
  if (typeof window === 'undefined') return false
  
  const hashParams = window.location.hash
  return hashParams.includes('#access_token') && hashParams.includes('type=recovery')
}
