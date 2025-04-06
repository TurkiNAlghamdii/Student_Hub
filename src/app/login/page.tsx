'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import './login.css'
import { FormEvent } from 'react'

// A wrapper component to safely use useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{email?: string; password?: string}>({})
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()

  // Check for success message from redirect
  useEffect(() => {
    const message = searchParams?.get('message')
    if (message) {
      setSuccessMessage(message)
    }
  }, [searchParams])

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  const validateForm = (): boolean => {
    const errors: {email?: string; password?: string} = {}
    let isValid = true
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
      isValid = false
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required'
      isValid = false
    }
    
    setFormErrors(errors)
    return isValid
  }

  const clearFieldError = (field: string) => {
    setFormErrors(prev => ({...prev, [field]: undefined}))
  }

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    setError(null)
    setSuccessMessage(null)
    
    // Validate form first
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Handle different error types with more user-friendly messages
        if (error.message.includes('Invalid login')) {
          throw new Error('Incorrect email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in.')
        } else {
          throw error
        }
      }

      // Store login timestamp for session management (8 hour limit)
      localStorage.setItem('sessionStartTime', Date.now().toString())
      
      router.push('/')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred during login. Please try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // If session exists, don't render the login form
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
          Welcome Back
        </motion.h2>
        
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="success-message"
          >
            {successMessage}
          </motion.div>
        )}
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-container">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="form-field"
            >
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                className={`input-field ${formErrors.email ? 'input-error' : ''}`}
                placeholder="Email address"
              />
              {formErrors.email && (
                <div className="field-error-message">
                  <ExclamationCircleIcon className="error-icon" />
                  {formErrors.email}
                </div>
              )}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="form-field relative"
            >
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                }}
                className={`input-field ${formErrors.password ? 'input-error' : ''}`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              {formErrors.password && (
                <div className="field-error-message">
                  <ExclamationCircleIcon className="error-icon" />
                  {formErrors.password}
                </div>
              )}
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="error-message"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4"
          >
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="forgot-password"
          >
            <Link
              href="/forgot-password"
              className="forgot-password-link"
            >
              Forgot your password?
            </Link>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="register-link-text"
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="register-link"
          >
            Register here
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}

// Add a loading state component
function LoginFormFallback() {
  return (
    <div className="login-container">
      <div className="login-card-skeleton">
        <div className="title-skeleton"></div>
        <div className="form-skeleton">
          <div className="input-skeleton"></div>
          <div className="input-skeleton"></div>
          <div className="button-skeleton"></div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function Login() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
