/**
 * Login Page Component
 * 
 * This client-side component handles user authentication through Supabase Auth.
 * It provides a form for users to enter their credentials and sign in to the application.
 * The page also includes public navigation links to features that don't require authentication,
 * and integrates with the application's theme system for consistent styling.
 * 
 * Key features:
 * - Email and password authentication
 * - Password visibility toggle
 * - Error handling and user feedback
 * - Automatic redirection for authenticated users
 * - Theme toggle for light/dark mode preference
 * - Links to public tools and registration
 * 
 * The component uses Framer Motion for animations to enhance the user experience
 * and follows the application's design system for consistent styling.
 */

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

/**
 * Login Component
 * 
 * The main component for handling user authentication.
 * 
 * @returns The rendered login form or null if user is already authenticated
 */
export default function Login() {
  // State management for form inputs and UI states
  const [email, setEmail] = useState('')               // User email input
  const [password, setPassword] = useState('')         // User password input
  const [showPassword, setShowPassword] = useState(false)  // Toggle for password visibility
  const [error, setError] = useState<string | null>(null)   // Error message display
  const [success, setSuccess] = useState<string | null>(null) // Success message display
  const [loading, setLoading] = useState(false)        // Loading state during authentication
  
  // Hooks for navigation and authentication
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useAuth()    // Current user session from AuthContext
  const { theme } = useTheme()     // Current theme from ThemeContext

  /**
   * Effect for handling authenticated users and URL parameters
   * 
   * - Redirects authenticated users to the home page
   * - Checks for success messages in URL parameters (e.g., after registration)
   */
  useEffect(() => {
    // Redirect authenticated users to home page
    if (session) {
      router.push('/')
    }
    
    // Check for message parameter in URL (e.g., from successful registration)
    const message = searchParams.get('message')
    if (message) {
      setSuccess(message)
    }
  }, [session, router, searchParams])

  /**
   * Handles the login form submission
   * 
   * This function authenticates the user with Supabase, handles errors,
   * and manages the login process including:  
   * - Preventing default form submission
   * - Setting loading state
   * - Authenticating with Supabase
   * - Checking if user account is disabled
   * - Setting session timestamp
   * - Error handling and user feedback
   * - Redirecting on successful login
   * 
   * @param e - Form submission event
   */
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)    // Show loading state
    setError(null)      // Clear any previous errors

    try {
      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Handle authentication errors
      if (error) throw error

      // Security check: verify if user account is disabled
      if (data.user?.user_metadata?.is_disabled) {
        await supabase.auth.signOut()
        throw new Error('This account has been disabled. Please contact support for assistance.')
      }

      // Store login timestamp for session management (8 hour limit)
      localStorage.setItem('sessionStartTime', Date.now().toString())
      
      // Redirect to home page on successful login
      router.push('/')
    } catch (err: unknown) {
      // Format and display error message
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during login';
      setError(errorMessage);
    } finally {
      // Reset loading state regardless of outcome
      setLoading(false);
    }
  }

  /**
   * Early return if user is already authenticated
   * This prevents rendering the login form for authenticated users
   * while the redirect in useEffect takes place
   */
  if (session) return null

  /**
   * Render the login form with animations and theme support
   * The component uses CSS classes that adapt to both light and dark themes
   * through the application's theme system (via ThemeContext)
   */
  return (
    <div className="login-container">
      {/* Mini Navigation Bar for Public Links and Theme Toggle */}
      {/* This section provides access to features that don't require authentication */}
      <motion.div 
        className="login-public-nav" 
        key="login-nav"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="public-nav-links">
          <Link href="/landing" className="public-tool-link">
            Home
          </Link>
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

      {/* Main Login Card */}
      {/* Contains the login form with animated entrance for better UX */}
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
          LOGIN
        </motion.h2>
        {/* Login Form */}
        {/* Handles user input and submission with appropriate validation */}
        <form className="login-form" onSubmit={handleLogin}>
          {/* Form Input Fields Container */}
          {/* Groups the email and password inputs with their animations */}
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

          {/* Error Message Display */}
          {/* Shows authentication errors with animation for better visibility */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="error-message"
            >
              {error}
            </motion.div>
          )}

          {/* Success Message Display */}
          {/* Shows success messages (e.g., from URL parameters) with animation */}
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="success-message"
            >
              {success}
            </motion.div>
          )}

          {/* Form Actions Container */}
          {/* Contains the submit button and forgot password link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col space-y-4"
          >
            {/* Submit Button */}
            {/* Changes text based on loading state and disables during submission */}
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            
            {/* Forgot Password Link */}
            {/* Provides access to password recovery functionality */}
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

        {/* Registration Link */}
        {/* Provides access to account creation for new users */}
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
