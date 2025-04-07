'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { FormEvent } from 'react'
import './forgot-password.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const router = useRouter()
  const { session } = useAuth()

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
            <p>Password reset email sent! Check your inbox for a link to reset your password.</p>
            <p className="mt-2 text-sm text-gray-400">
              If you don&apos;t see the email, check your spam folder or try again in a few minutes.
            </p>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400 mb-2">
                When you receive the email:
              </p>
              <ol className="text-sm text-gray-400 list-decimal list-inside">
                <li>Click the reset link in the email</li>
                <li>Enter your new password on the reset page</li>
                <li>Submit to update your password</li>
              </ol>
            </div>
            <Link href="/login" className="back-to-login">
              Back to login
            </Link>
          </motion.div>
        ) : (
          <form className="login-form" onSubmit={handleResetPassword}>
            <motion.p
              className="reset-instructions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Enter your KAU email address (@stu.kau.edu.sa or @kau.edu.sa) and we&apos;ll send you a link to reset your password.
            </motion.p>
            
            <div className="input-container">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="sr-only">
                  KAU Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="yourname@stu.kau.edu.sa"
                />
              </motion.div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="error-message"
              >
                {error}
                {errorDetails && (
                  <details className="error-details">
                    <summary>Technical details</summary>
                    <p>{errorDetails}</p>
                  </details>
                )}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading || attemptCount >= 10}
                className="submit-button"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="back-link-text"
            >
              Remember your password?{' '}
              <Link
                href="/login"
                className="back-link"
              >
                Back to login
              </Link>
            </motion.p>
          </form>
        )}
      </motion.div>
    </div>
  )
} 