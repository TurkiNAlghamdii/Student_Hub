/**
 * Supabase Client Configuration Module
 *
 * This module provides configured Supabase clients for both client-side and server-side usage.
 * It initializes the Supabase connection with appropriate environment variables and configuration
 * options for authentication and session management.
 *
 * Key features:
 * - Client-side Supabase client with persistent sessions
 * - Server-side admin client with elevated privileges
 * - Environment variable validation
 * - Automatic token refresh
 * - Session detection in URL (for OAuth flows)
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Environment variables for Supabase configuration
 * 
 * NEXT_PUBLIC_SUPABASE_URL: The URL of your Supabase instance
 * NEXT_PUBLIC_SUPABASE_ANON_KEY: The anonymous API key for client-side operations
 * SUPABASE_SERVICE_ROLE_KEY: The service role key for admin operations (server-side only)
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * Validate required environment variables
 * This ensures the application doesn't start without proper configuration
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Client-side Supabase client
 * 
 * This client is intended for use in browser environments and components.
 * It's configured with:
 * - persistSession: true - Stores the session in localStorage
 * - autoRefreshToken: true - Automatically refreshes the token before expiry
 * - detectSessionInUrl: true - Detects and processes auth tokens in URL after OAuth login
 * 
 * @example
 * // Fetch data from a protected table
 * const { data, error } = await supabase
 *   .from('protected_table')
 *   .select('*')
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

/**
 * Admin Supabase client with service role key
 * 
 * IMPORTANT: This client should ONLY be used in server-side code (API routes, Server Components, etc.)
 * It has elevated privileges that bypass Row Level Security (RLS) policies.
 * 
 * Security considerations:
 * - Never expose this client to the browser
 * - Use only in trusted server environments
 * - Configured with non-persistent sessions for security
 * 
 * @example
 * // Server-side API route that needs to bypass RLS
 * // pages/api/admin-only.ts
 * export default async function handler(req, res) {
 *   const { data } = await supabaseAdmin
 *     .from('users')
 *     .select('*')
 *   res.status(200).json(data)
 * }
 */
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper function to check if we're in a password reset flow
export const isPasswordResetFlow = () => {
  if (typeof window === 'undefined') return false
  
  const hashParams = window.location.hash
  return hashParams.includes('#access_token') && hashParams.includes('type=recovery')
}
