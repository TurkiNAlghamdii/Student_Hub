import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Function to safely access localStorage (handles cross-domain issues)
const getLocalStorageKey = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  }
  return null;
};

// Function to safely set localStorage (handles cross-domain issues)
const setLocalStorageKey = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }
};

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token',
    flowType: 'pkce',
    storage: {
      getItem: getLocalStorageKey,
      setItem: setLocalStorageKey,
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Error removing item from localStorage:', error);
          }
        }
      }
    }
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
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
