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
  isPasswordRecovery: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  checkSessionExpiry: () => false,
  isPasswordRecovery: false
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
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

    // Check if we're in a password recovery flow by looking at the URL
    if (typeof window !== 'undefined') {
      const hashParams = window.location.hash;
      const isRecoveryFlow = hashParams.includes('#access_token') && 
                            hashParams.includes('type=recovery');
      
      setIsPasswordRecovery(isRecoveryFlow);
      
      if (isRecoveryFlow) {
        console.log("Password recovery flow detected in AuthContext");
        
        // Listen specifically for auth state changes during recovery flow
        const handleRecoveryStateChange = async () => {
          try {
            // Get current session after token processing
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error getting session during recovery flow:", error);
            } else if (data.session) {
              console.log("Recovery session established in AuthContext");
              setSession(data.session);
              setUser(data.session.user);
            } else {
              console.log("No session found during recovery flow");
            }
          } catch (err) {
            console.error("Error in recovery flow handling:", err);
          }
        };
        
        // Initial check
        handleRecoveryStateChange();
      }
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state change detected, event:", _event);
      
      // Special handling for password recovery flow
      if (_event === 'PASSWORD_RECOVERY' || _event === 'USER_UPDATED') {
        // If we're in a password recovery flow and the user just updated their password
        if (isPasswordRecovery && window.location.pathname.includes('/reset-password')) {
          console.log("Detected password update during recovery flow");
          // Do not update session state - this will be handled by the reset-password page
          return;
        }
      }
      
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
        localStorage.setItem('lastActivity', Date.now().toString());
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
      checkSessionExpiry,
      isPasswordRecovery
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
} 