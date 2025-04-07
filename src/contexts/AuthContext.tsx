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

        // Check if user is disabled
        if (session.user?.user_metadata?.is_disabled) {
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
      if (session) {
        // Check if user is disabled
        if (session.user?.user_metadata?.is_disabled) {
          handleSignOut();
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // If we get a new session, store the login timestamp
        localStorage.setItem('sessionStartTime', Date.now().toString());
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSessionExpiry = (): boolean => {
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      const now = Date.now();
      const timeDiff = now - lastActivityTime;
      if (timeDiff > 30 * 60 * 1000) { // 30 minutes
        handleSignOut();
        return true;
      }
    }
    return false;
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkSessionExpiry, handleSignOut]);

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