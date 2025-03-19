'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SessionChecker() {
  const { checkSessionExpiry, signOut, session } = useAuth()

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
    }, 5 * 60 * 1000) // Check every 5 minutes
    
    return () => clearInterval(intervalId)
  }, [session, checkSessionExpiry, signOut])

  // This component doesn't render anything
  return null
} 