'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { FormEvent } from 'react'
import './forgot-password.css'

// Theme Toggle Button Component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const router = useRouter()
  const { session } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  // Rate limiting check (10 attempts maximum in a session)
  useEffect(() => {
    if (attemptCount >= 10) {
      setError('Too many reset attempts. Please try again later.');
    }
  }, [attemptCount]);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Check rate limiting
    if (attemptCount >= 10) {
      setError('Too many reset attempts. Please try again later.');
      return;
    }

    // Simple email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    // Domain validation - check if email is from allowed domains
    const ALLOWED_DOMAINS = ['@stu.kau.edu.sa', '@kau.edu.sa'];
    const domain = email.substring(email.indexOf('@'));
    
    if (!ALLOWED_DOMAINS.includes(domain)) {
      setError('Please use your KAU email address (@stu.kau.edu.sa or @kau.edu.sa).');
      return;
    }
    
    setLoading(true)
    setError(null)
    setErrorDetails(null)
    setSuccess(false)
    setAttemptCount(prev => prev + 1) // Increment attempt counter

    try {
      // Requesting password reset
      
      // Get the base URL for the redirect
      // Use the current origin to ensure the reset link works in any environment
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = `${origin}/reset-password`;
      
      // Send the password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) {
        // More specific error messages
        if (error.message.includes('rate limit')) {
          setError('Too many requests. Please try again later.');
        } else if (error.message.includes('not found')) {
          // For security, we don't want to reveal if an email exists in the system
          // So we show success even if the email doesn't exist
          setSuccess(true);
          return;
        } else if (error.message.includes('network')) {
          setError('Network error. Please check your internet connection and try again.');
          setErrorDetails(error.message);
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during password reset request';
      setError('We encountered an issue sending the reset email. Please try again later.');
      setErrorDetails(errorMessage); // Store detailed error for debugging
    } finally {
      setLoading(false);
    }
  }

  // If session exists, don't render the form
  if (session) return null

  return (
    <div className="login-container">
      <ThemeToggle />
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="login-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Reset Password
        </motion.h2>
        
        {success ? (
          <motion.div
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`p-3 rounded-lg mb-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p>Password reset email sent!</p>
            </div>
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Check your inbox for a link to reset your password.</p>
            <div className={`rounded-lg p-4 mb-5 ${theme === 'dark' ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-100 border border-gray-200'}`}>
              <p className={`text-sm mb-3 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Next steps:</p>
              <ol className={`text-sm list-decimal list-inside space-y-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                <li>Open the email from Student Hub</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password on the reset page</li>
                <li>Log in with your new password</li>
              </ol>
            </div>
            <p className={`text-xs italic mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
              If you don&apos;t see the email within a few minutes, check your spam folder or try again.
            </p>
            <Link href="/login" className={`inline-block px-4 py-2 rounded-lg transition-all w-full text-center ${theme === 'dark' ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-600 hover:to-gray-700 border border-gray-700/50' : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 border border-gray-300'}`}>
              Back to Login
            </Link>
          </motion.div>
        ) : (
          <form className="login-form" onSubmit={handleResetPassword}>
            <motion.div
              className={`rounded-lg p-4 mb-6 ${theme === 'dark' ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-gray-100 border border-gray-200'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Enter your KAU email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Only <span className={`font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>@stu.kau.edu.sa</span> and <span className={`font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>@kau.edu.sa</span> domains are accepted.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <div className="input-container">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="email" className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="yourname@stu.kau.edu.sa"
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">Example: john.doe@stu.kau.edu.sa</p>
                  <p className="text-xs text-gray-500">{email.length > 0 ? email.length : 0} / 50</p>
                </div>
              </motion.div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="error-message"
              >
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm">{error}</p>
                    {errorDetails && (
                      <details className="error-details mt-1 text-xs">
                        <summary className="cursor-pointer">Technical details</summary>
                        <p className="mt-1 pl-2 border-l-2 border-red-400/30">{errorDetails}</p>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <button
                type="submit"
                disabled={loading || attemptCount >= 10}
                className="submit-button flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Reset Link
                  </>
                )}
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center border-t border-gray-800 pt-4"
            >
              <p className="text-sm text-gray-400 mb-2">Remember your password?</p>
              <Link
                href="/login"
                className="inline-block text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Back to Login
              </Link>
            </motion.div>
          </form>
        )}
      </motion.div>
    </div>
  )
} 