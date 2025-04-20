'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    // The route.ts handler will process the authentication
    // This page just provides a better UX while that happens
    
    // Set a timeout to redirect to login if it takes too long
    const timeout = setTimeout(() => {
      router.push('/login?message=Email confirmation processed. You can now log in.')
    }, 5000) // 5 seconds timeout
    
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Email Confirmation</h1>
        <div className="flex justify-center mb-4">
          <LoadingSpinner />
        </div>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  )
}
