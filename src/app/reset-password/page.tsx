/**
 * Reset Password Page Component
 * 
 * This client-side component handles the password reset process after a user
 * clicks on a reset link from their email. It validates the reset token from the URL,
 * provides a form for entering a new password, and handles the password update process.
 * 
 * Key features:
 * - Token validation from URL hash parameters
 * - Password strength validation with visual feedback
 * - Comprehensive error handling for various scenarios
 * - Success state with automatic redirect to login
 * - Theme-aware UI that adapts to light/dark mode
 * 
 * The component integrates with the application's theme system through CSS classes
 * and conditional styling that adapt to both light and dark modes via the root element class,
 * ensuring consistent styling and preventing flash of incorrect theme during navigation.
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { FormEvent } from 'react'
import './reset-password.css'

/**
 * Theme Toggle Button Component
 * 
 * A simple component that allows users to toggle between light and dark themes.
 * It uses the ThemeContext to access the current theme state and toggle function.
 * 
 * The button displays a sun icon in dark mode and a moon icon in light mode,
 * providing intuitive visual feedback about the current theme and the action
 * that will occur when clicked.
 * 
 * @returns A button component that toggles the theme when clicked
 */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()  // Access theme context
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-button"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Show sun icon in dark mode, moon icon in light mode */}
      {theme === 'dark' ? (
        <SunIcon className="h-5 w-5" />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
    </button>
  )
}

/**
 * Reset Password Component
 * 
 * Main component for handling the password reset process after a user clicks
 * on a reset link from their email. It validates the token, provides a form for
 * entering a new password, and handles the password update.
 * 
 * @returns The rendered password reset form with appropriate state handling
 */
export default function ResetPassword() {
  // Form state
  const [password, setPassword] = useState('')                       // New password input
  const [confirmPassword, setConfirmPassword] = useState('')        // Confirm password input
  const [showPassword, setShowPassword] = useState(false)           // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)  // Toggle confirm password visibility
  
  // Process state
  const [error, setError] = useState<string | null>(null)           // Error message display
  const [success, setSuccess] = useState(false)                     // Success state after password reset
  const [loading, setLoading] = useState(false)                     // Loading state during form submission
  
  // Token validation state
  const [tokenProcessed, setTokenProcessed] = useState(false)       // Whether token processing has been attempted
  const [processingToken, setProcessingToken] = useState(true)      // Token processing in progress
  const [hasValidToken, setHasValidToken] = useState(false)         // Whether a valid token was found
  
  // Redirect state
  const [countdown, setCountdown] = useState(5)                     // Countdown timer for redirect after success
  
  // Hooks
  const router = useRouter()
  const { session, isPasswordRecovery } = useAuth()                 // Auth context for session and recovery state
  const { theme } = useTheme()                                      // Theme context for styling

  /**
   * Countdown Timer Effect
   * 
   * Handles the countdown timer after a successful password reset,
   * automatically redirecting to the login page when the countdown reaches zero.
   * This provides a better user experience by giving feedback about the
   * upcoming redirect while allowing users to manually navigate if desired.
   */
  useEffect(() => {
    if (success && countdown > 0) {
      // Set up a timer to decrement the countdown every second
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      // Clean up the timer when the component unmounts or countdown changes
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // Only redirect when countdown reaches zero
      router.push('/login');
    }
  }, [success, countdown, router]);

  /**
   * Recovery Token Processing Effect
   * 
   * This effect handles the validation of the password reset token from the URL hash.
   * It runs once when the component mounts and performs several checks:
   * 1. Extracts the token from the URL hash parameters
   * 2. Verifies the token with Supabase Auth
   * 3. Handles various error cases (expired token, missing token, etc.)
   * 4. Sets appropriate state based on token validation results
   * 
   * If no valid token is found, it redirects the user to the forgot password page
   * after displaying an appropriate error message.
   */
  useEffect(() => {
    const processRecoveryToken = async () => {
      try {
        // Skip if token has already been processed
        if (tokenProcessed) return;
        
        setProcessingToken(true);
        
        if (typeof window !== 'undefined') {
          const hashParams = window.location.hash;
          
          // Check if URL contains a recovery token
          if (hashParams.includes('access_token') && hashParams.includes('type=recovery')) {
            setHasValidToken(true);

            // Try to get the current session
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              // Handle expired token error
              if (error.message.includes('expired')) {
                setError('Your password reset link has expired. Please request a new one.');
                setHasValidToken(false);
              }
            } else if (!data.session) {
              // If no session exists, try to verify the token directly
              try {
                const tokenMatch = hashParams.match(/access_token=([^&]+)/);
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1];
                  
                  // Verify the OTP token
                  const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'recovery',
                  });
                  
                  // Handle expired token error
                  if (verifyError && verifyError.message.includes('expired')) {
                    setError('Your password reset link has expired. Please request a new one.');
                    setHasValidToken(false);
                  }
                }
              } catch (err) {
                console.error('Token verification error:', err);
              }
            }
          } else if (!isPasswordRecovery && session) {
            // If user is already logged in and not in recovery mode, redirect to home
            router.push('/');
            return;
          } else if (!hashParams.includes('access_token')) {
            // If no token is found in the URL
            setError('No reset token found. Please request a password reset from the login page.');
            setHasValidToken(false);
            
            // Redirect to forgot password page after a delay
            setTimeout(() => {
              router.push('/forgot-password');
            }, 3000);
          }
        }
        
        // Mark token as processed regardless of outcome
        setTokenProcessed(true);
        setProcessingToken(false);
      } catch (err) {
        // Handle unexpected errors
        setError('An unexpected error occurred. Please try again or contact support if the issue persists.');
        setHasValidToken(true);
        setProcessingToken(false);
        setTokenProcessed(true);
      }
    };
    
    // Run the token processing function
    processRecoveryToken();
  }, [router, session, isPasswordRecovery, tokenProcessed]);

  /**
   * Handle Password Reset Form Submission
   * 
   * This function processes the password reset form submission, including:
   * 1. Validating password requirements (matching, length, complexity)
   * 2. Updating the user's password in Supabase Auth
   * 3. Handling various error cases with specific error messages
   * 4. Setting success state and signing out the user after successful reset
   * 
   * @param e - Form submission event
   */
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Validate password requirements
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please ensure both entries are identical.');
        setLoading(false);
        return;
      }
      
      // Check password length
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
      
      // Check for uppercase letters
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter.');
        setLoading(false);
        return;
      }
      
      // Check for numbers
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number.');
        setLoading(false);
        return;
      }
      
      // Step 2: Update the user's password in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      // Step 3: Handle errors with specific messages
      if (error) {
        if (error.message.includes('different from the old password') || 
            error.message.includes('New password should be different')) {
          setError('Your new password cannot be the same as your current password. Please choose a different password.');
        } else if (error.message.includes('auth') || error.message.includes('token')) {
          setError('Authentication error: ' + error.message);
        } else if (error.message.includes('weak')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else {
          setError(`Error updating password: ${error.message}`);
        }
        
        setLoading(false);
        return;
      }
      
      // Step 4: Handle success case
      if (data) {
        // Sign out the user after successful password reset
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('Error signing out:', signOutErr);
        }
        
        // Set success state and reset form
        setSuccess(true);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      // Handle unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during password reset';
      setError(`Error: ${errorMessage}`);
    } finally {
      // Reset loading state regardless of outcome
      setLoading(false);
    }
  };

  /**
   * Render the password reset interface
   * The component adapts to the current theme through conditional styling
   * and CSS classes that work with both light and dark modes.
   */
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
          Create New Password
        </motion.h2>
        
        {success ? (
          <motion.div
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={`p-3 rounded-lg mb-4 flex items-center gap-3 ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Password successfully updated!</p>
            </div>
            <p className={`mb-3 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your password has been changed.</p>
            <p className={`mb-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Please log in with your new password.</p>
            
            {/* Countdown timer */}
            <div className="flex items-center justify-center mb-4">
              <div className={`text-sm py-2 px-5 rounded-full flex items-center gap-2 shadow-lg ${theme === 'dark' ? 'bg-gray-800/70 text-gray-300 border border-emerald-500/30 shadow-emerald-900/10' : 'bg-gray-100 text-gray-700 border border-emerald-300/30 shadow-emerald-900/5'}`}>
                <svg className={`animate-spin h-4 w-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Redirecting to login in <span className={`font-bold text-base ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{countdown}</span> seconds</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Link href="/login" className={`inline-block px-4 py-2 rounded-lg transition-all w-full text-center ${theme === 'dark' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'}`}>
                Go to Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {processingToken ? (
              <div className="processing-message">
                <div className="loader"></div>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>Verifying your reset link...</p>
              </div>
            ) : (
              <>
                {!hasValidToken ? (
                  <div className="no-token-message">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className={`mb-3 text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{error || 'Invalid or expired reset link'}</p>
                    <Link href="/forgot-password" className="back-to-login">Request a new reset link</Link>
                  </div>
                ) : (
                  <form className="login-form" onSubmit={handleResetPassword}>
                    {/* Password requirements help */}
                    <div className={`rounded-lg p-3 mb-6 ${theme === 'dark' ? 'bg-gray-800/40 border border-gray-700/50' : 'bg-gray-100 border border-gray-200'}`}>
                      <p className={`text-sm mb-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Your password must:</p>
                      <ul className={`text-xs space-y-1 pl-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${password.length >= 8 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={password.length >= 8 ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                          </svg>
                          Be at least 8 characters long
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${/[A-Z]/.test(password) ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[A-Z]/.test(password) ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                          </svg>
                          Include at least one uppercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${/[0-9]/.test(password) ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-gray-600' : 'text-gray-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[0-9]/.test(password) ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                          </svg>
                          Include at least one number
                        </li>
                      </ul>
                    </div>

                    <div className="input-container">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label htmlFor="password" className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password strength meter */}
                        {password.length > 0 && (
                          <div className="mt-2">
                            <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                                    ? 'bg-emerald-500 w-full' 
                                    : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                                      ? 'bg-emerald-500/70 w-3/4' 
                                      : password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))
                                        ? 'bg-yellow-500 w-2/4'
                                        : 'bg-red-500 w-1/4'
                                }`}
                              />
                            </div>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)
                                ? 'Strong password' 
                                : password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
                                  ? 'Good password' 
                                  : password.length >= 8 && (/[A-Z]/.test(password) || /[0-9]/.test(password))
                                    ? 'Fair password'
                                    : 'Weak password'}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    <div className="input-container">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <label htmlFor="confirmPassword" className={`block mb-2 text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`input-field ${confirmPassword && password !== confirmPassword ? 'border-red-500/50 focus:border-red-500/70' : ''}`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5" />
                            ) : (
                              <EyeIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password match indicator */}
                        {confirmPassword && (
                          <div className="flex items-center gap-2 mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${password === confirmPassword ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={password === confirmPassword ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                            </svg>
                            <p className={`text-xs ${password === confirmPassword ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : 'text-red-400'}`}>
                              {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {error && !error.includes('expired') && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="error-message mb-4"
                      >
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{error}</p>
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
                        disabled={loading || password !== confirmPassword || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)}
                        className="submit-button"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating Password...
                          </div>
                        ) : 'Reset Password'}
                      </button>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className={`mt-6 text-center pt-4 ${theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}
                    >
                      <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Having trouble?</p>
                      <Link href="/forgot-password" className={`text-sm ${theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'} transition-colors`}>
                        Request a new reset link
                      </Link>
                    </motion.div>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
