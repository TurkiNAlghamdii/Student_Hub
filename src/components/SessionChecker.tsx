/**
 * SessionChecker Component
 *
 * A utility component that monitors the user's authentication session and
 * automatically signs them out when their session expires. This component
 * doesn't render any UI elements but works in the background to maintain
 * proper authentication state.
 *
 * Key features:
 * - Checks session expiry on initial load
 * - Performs periodic checks every 5 minutes
 * - Automatically signs out users with expired sessions
 * - Helps maintain application security by enforcing session timeouts
 * - Works with the application's authentication context
 */

'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * SessionChecker component implementation
 * 
 * @returns null - This component doesn't render anything visible
 */
export default function SessionChecker() {
  // Get authentication utilities and session state from context
  const { checkSessionExpiry, signOut, session } = useAuth()

  /**
   * Effect to check session expiry on load and periodically
   * 
   * This effect runs when the component mounts and whenever the session,
   * checkSessionExpiry function, or signOut function changes. It performs
   * an immediate check for session expiry and sets up a periodic check
   * every 5 minutes to ensure users are signed out when their session expires.
   */
  useEffect(() => {
    // Check if the session has expired when the app first loads
    if (session) {
      const isExpired = checkSessionExpiry()
      
      if (isExpired) {
        console.log('Session expired (8-hour limit), signing out')
        signOut()
      }
    }
    
    // Also set up a periodic check (every 5 minutes)
    const intervalId = setInterval(() => {
      if (session && checkSessionExpiry()) {
        console.log('Session expired during use, signing out')
        signOut()
      }
    }, 5 * 60 * 1000) // Check every 5 minutes (5min * 60sec * 1000ms)
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [session, checkSessionExpiry, signOut])

  // This component doesn't render any visible UI elements
  // It only performs the session checking logic in the background
  return null
}