/**
 * AuthContext Module
 *
 * This context provides authentication state and functions throughout the application.
 * It handles user sessions, authentication state changes, and session expiry management.
 *
 * Key features:
 * - User authentication state management
 * - Session tracking and automatic refresh
 * - Session expiry checking (8-hour limit)
 * - Automatic sign-out for expired or inactive sessions
 * - Special handling for password recovery flows
 * - Integration with Supabase Auth
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'

/**
 * Interface defining the shape of the authentication context
 * 
 * @property user - Current authenticated user or null if not authenticated
 * @property session - Current active session or null if not authenticated
 * @property loading - Boolean indicating if auth state is still being determined
 * @property signOut - Function to sign out the current user
 * @property checkSessionExpiry - Function to check if the current session has expired
 * @property isPasswordRecovery - Boolean indicating if we're in a password recovery flow
 */
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  checkSessionExpiry: () => boolean
  isPasswordRecovery: boolean
}

/**
 * Create the authentication context with default values
 * These defaults are used before the provider is initialized
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  checkSessionExpiry: () => false,
  isPasswordRecovery: false
})

/**
 * AuthProvider component that wraps the application and provides authentication context
 * 
 * This provider handles:
 * - Initial session loading
 * - Session refresh
 * - Auth state changes
 * - Password recovery flows
 * - Session expiry management
 * 
 * @param props - Component props
 * @param props.children - Child components to be wrapped with the auth context
 * @returns React component that provides auth context to its children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // State for the current authenticated user
  const [user, setUser] = useState<User | null>(null)
  // State for the current session
  const [session, setSession] = useState<Session | null>(null)
  // Loading state while auth is being determined
  const [loading, setLoading] = useState(true)
  // Flag for password recovery flow
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const router = useRouter()

  // Set the session duration to 8 hours in milliseconds
  const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours in milliseconds

  /**
   * Effect to initialize authentication state and handle session management
   * Runs once when the component mounts
   */
  useEffect(() => {
    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check if the session is expired based on our custom rules
        const isExpired = checkSessionExpiry();
        
        if (isExpired) {
          // If session is expired, sign out the user
          handleSignOut();
          return;
        }

        // Check if user account has been disabled by an admin
        if (session.user?.user_metadata?.is_disabled) {
          handleSignOut();
          return;
        }
        
        // Set the session and user in state
        setSession(session);
        setUser(session?.user ?? null);
      }
      // Mark loading as complete
      setLoading(false);
    })

    /**
     * Special handling for password recovery flow
     * Detects if we're in a recovery flow based on URL hash parameters
     */
    if (typeof window !== 'undefined') {
      const hashParams = window.location.hash;
      const isRecoveryFlow = hashParams.includes('#access_token') && 
                            hashParams.includes('type=recovery');
      
      setIsPasswordRecovery(isRecoveryFlow);
      
      if (isRecoveryFlow) {
        console.log("Password recovery flow detected in AuthContext");
        
        /**
         * Handler for recovery-specific auth state changes
         * Gets the current session after token processing
         */
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
        
        // Initial check for recovery flow
        handleRecoveryStateChange();
      }
    }

    /**
     * Set up listener for authentication state changes
     * This handles events like sign-in, sign-out, session refresh, etc.
     */
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
        // Check if user account has been disabled
        if (session.user?.user_metadata?.is_disabled) {
          handleSignOut();
          return;
        }
        
        // Update session and user state
        setSession(session);
        setUser(session?.user ?? null);
        
        // Store timestamps for session management
        localStorage.setItem('sessionStartTime', Date.now().toString());
        localStorage.setItem('lastActivity', Date.now().toString());
      } else {
        // Clear session and user state when signed out
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    })

    // Clean up subscription when component unmounts
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Checks if the current session has expired due to inactivity
   * Sessions expire after 30 minutes of inactivity
   * Only applies to authenticated users
   * 
   * @returns Boolean indicating if the session has expired
   */
  const checkSessionExpiry = (): boolean => {
    // Only check session expiry for authenticated users
    if (!session) {
      return false;
    }
    
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
      const lastActivityTime = parseInt(lastActivity);
      const now = Date.now();
      const timeDiff = now - lastActivityTime;
      if (timeDiff > 30 * 60 * 1000) { // 30 minutes of inactivity
        handleSignOut();
        return true;
      }
    }
    return false;
  };

  /**
   * Signs out the current user and redirects to login page
   * Clears session data from Supabase and local state
   */
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  /**
   * Effect to periodically check for session expiry
   * Runs a check every minute to ensure timely session expiry
   */
  useEffect(() => {
    const interval = setInterval(() => {
      checkSessionExpiry();
    }, 60000); // Check every minute

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [checkSessionExpiry, handleSignOut]);

  // Provide auth context to children components
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

/**
 * Custom hook to access the auth context throughout the application
 * Provides a convenient way to access auth state and functions
 * 
 * @returns The current auth context value
 */
export const useAuth = () => {
  return useContext(AuthContext)
}