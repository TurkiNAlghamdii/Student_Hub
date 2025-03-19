'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  checkSessionExpiry: () => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  checkSessionExpiry: () => false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Set the session duration to 8 hours in milliseconds
  const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if the session is expired
        const isExpired = checkSessionExpiry();
        
        if (isExpired) {
          // If session is expired, sign out
          handleSignOut();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      // If we get a new session, store the login timestamp
      if (session) {
        localStorage.setItem('sessionStartTime', Date.now().toString());
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check if the session has expired based on the stored timestamp
  const checkSessionExpiry = () => {
    const sessionStartTimeStr = localStorage.getItem('sessionStartTime');
    if (!sessionStartTimeStr) return false;
    
    const sessionStartTime = parseInt(sessionStartTimeStr, 10);
    const currentTime = Date.now();
    
    // Check if we've exceeded the session duration
    return (currentTime - sessionStartTime) > SESSION_DURATION;
  }

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    localStorage.removeItem('sessionStartTime')
    setUser(null)
    setSession(null)
    setLoading(false)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signOut: handleSignOut,
      checkSessionExpiry
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 