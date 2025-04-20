'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import './login.css'
import { FormEvent } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { theme } = useTheme()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
    
    // Check for message parameter in URL
    const message = searchParams.get('message')
    if (message) {
      setSuccess(message)
    }
  }, [session, router, searchParams])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check if user is disabled
      if (data.user?.user_metadata?.is_disabled) {
        await supabase.auth.signOut()
        throw new Error('This account has been disabled. Please contact support for assistance.')
      }

      // Store login timestamp for session management (8 hour limit)
      localStorage.setItem('sessionStartTime', Date.now().toString())
      
      router.push('/')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // If session exists, don't render the login form
  if (session) return null

  return (
    <div className="login-container">
      {/* Mini Nav for Public Links and Theme Toggle */}
      <motion.div 
        className="login-public-nav" 
        key="login-nav"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="public-nav-links">
          <Link href="/academic-calendar" className="public-tool-link">
            Academic Calendar
          </Link>
          <Link href="/gpa-calculator" className="public-tool-link">
            GPA Calculator
          </Link>
          <Link href="/pomodoro" className="public-tool-link">
            Pomodoro Clock
          </Link>
        </div>
        <ThemeToggle />
      </motion.div>

      <motion.div
        className="login-card" key="login-card"
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
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-container">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
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
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Email address"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
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
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
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

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="success-message"
            >
              {success}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col space-y-4"
          >
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Link href="/forgot-password" className="forgot-password-link">
                Forgot your password?
              </Link>
            </motion.div>
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
