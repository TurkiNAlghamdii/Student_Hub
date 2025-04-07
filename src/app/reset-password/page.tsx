'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { FormEvent } from 'react'
import './reset-password.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenProcessed, setTokenProcessed] = useState(false)
  const [processingToken, setProcessingToken] = useState(true) // To show loading state while processing token
  const [hasValidToken, setHasValidToken] = useState(false) // To control whether the form should be shown
  const router = useRouter()
  const { session, isPasswordRecovery } = useAuth()

  // Process the recovery token directly
  useEffect(() => {
    const processRecoveryToken = async () => {
      try {
        // Only run once
        if (tokenProcessed) return;
        
        setProcessingToken(true);
        
        // Check if there's a token in the URL
        if (typeof window !== 'undefined') {
          const hashParams = window.location.hash;
          
          if (hashParams.includes('access_token') && hashParams.includes('type=recovery')) {
            // Supabase should automatically process this, but we need to wait
            // until it's complete before checking the session
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              setError('Error validating your reset token. Please try again or request a new reset link.');
              setProcessingToken(false);
              setTokenProcessed(true);
              return;
            }
            
            if (!data.session) {
              // Try to manually extract and use the token
              try {
                const tokenMatch = hashParams.match(/access_token=([^&]+)/);
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1];
                  
                  // This should set up the session from the token
                  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'recovery',
                  });
                  
                  if (verifyError) {
                    // Provide specific error messages based on the error type
                    if (verifyError.message.includes('expired')) {
                      setError('Your password reset link has expired. Please request a new one.');
                    } else if (verifyError.message.includes('invalid')) {
                      setError('Invalid reset token. Please ensure you\'re using the link from the most recent email.');
                    } else {
                      setError('Unable to verify your reset token. Please request a new password reset link.');
                    }
                  } else if (verifyData) {
                    setHasValidToken(true);
                  } else {
                    setError('Could not process your reset request. Please try again with a new reset link.');
                  }
                } else {
                  setError('Invalid reset link format. Please use the exact link from your email.');
                }
              } catch (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _) {
                setError('An error occurred while processing your reset token. Please try again with a new reset link.');
              }
            } else {
              setHasValidToken(true);
            }
          } else if (!isPasswordRecovery && session) {
            // If user is already logged in and not resetting password, redirect to home
            router.push('/');
            return;
          } else if (!hashParams.includes('access_token')) {
            // No token in URL, but user accessed this page directly
            setError('No reset token found. Please request a password reset from the login page.');
            
            // Redirect to forgot-password page after a short delay
            setTimeout(() => {
              router.push('/forgot-password');
            }, 3000);
          }
        }
        
        setTokenProcessed(true);
        setProcessingToken(false);
      } catch (/* eslint-disable-line @typescript-eslint/no-unused-vars */ _) {
        setError('An unexpected error occurred. Please try again or contact support if the issue persists.');
        setProcessingToken(false);
        setTokenProcessed(true);
      }
    };
    
    processRecoveryToken();
  }, [router, session, isPasswordRecovery, tokenProcessed]);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Double check that we have a valid token/session before allowing password reset
      if (!hasValidToken) {
        setError('Invalid session. Please request a new password reset link.');
        setLoading(false);
        return;
      }
      
      // Validate passwords with more detailed feedback
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please ensure both entries are identical.');
        setLoading(false);
        return;
      }
      
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
      
      // Additional password validation
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter.');
        setLoading(false);
        return;
      }
      
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number.');
        setLoading(false);
        return;
      }

      // Get current session again to ensure we have the latest
      const { data: sessionData } = await supabase.auth.getSession();
                 
      if (!sessionData.session) {
        setError('Your session has expired. Please request a new password reset link.');
        setLoading(false);
        return;
      }

      // Try to update the password and catch specific AuthApiError
      try {
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          throw error;
        }

        setSuccess(true);
        
        // Clear form fields
        setPassword('');
        setConfirmPassword('');
        
        // After successful password reset, redirect to login after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error: unknown) {
        // Handle the specific "same password" error
        const errorObj = error as { message?: string };
        
        if (errorObj.message &&
           (errorObj.message.includes('different from the old password') || 
            errorObj.message.includes('New password should be different'))) {
          setError('Your new password cannot be the same as your current password. Please choose a different password.');
          setLoading(false);
          return;
        }
        
        // Handle other specific error cases
        if (error?.message?.includes('auth')) {
          setError('Authentication error. Your reset session may have expired. Please request a new reset link.');
        } else if (error?.message?.includes('weak')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else {
          // Rethrow any other errors to be caught by the outer catch block
          throw error;
        }
      }
    } catch (err: unknown) {
      // Generic error handler as a fallback
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during password reset';
      
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('different from the old password') || 
            errorMessage.includes('New password should be different')) {
          setError('Your new password cannot be the same as your current password. Please choose a different password.');
        } else {
          setError(`An error occurred during password reset. Please try again with a different password.`);
        }
      } else {
        setError('An unexpected error occurred. Please try a different password or contact support.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          Create New Password
        </motion.h2>
        
        {processingToken && (
          <motion.div
            className="processing-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loader"></div>
            <p>Processing your reset request...</p>
          </motion.div>
        )}
        
        {success ? (
          <motion.div
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>Your password has been successfully reset!</p>
            <p>Redirecting to login page...</p>
            <Link href="/login" className="back-to-login">
              Back to login
            </Link>
          </motion.div>
        ) : (
          !processingToken && (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="error-message"
                >
                  {error}
                  {!hasValidToken && (
                    <p className="mt-2">Redirecting to password reset request page...</p>
                  )}
                </motion.div>
              )}
              
              {hasValidToken ? (
                <form className="login-form" onSubmit={handleResetPassword}>
                  <motion.p
                    className="reset-instructions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Please enter a new password for your account.
                  </motion.p>
                  
                  <div className="password-requirements">
                    <p className="text-sm text-gray-400 mb-2">Password must:</p>
                    <ul className="text-xs text-gray-400 list-disc list-inside mb-4">
                      <li>Be at least 8 characters long</li>
                      <li>Include at least one uppercase letter</li>
                      <li>Include at least one number</li>
                      <li>Be different from your current password</li>
                    </ul>
                  </div>
                  
                  <div className="input-container">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative"
                    >
                      <label htmlFor="password" className="sr-only">
                        New Password
                      </label>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field"
                        placeholder="New Password"
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
                    
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="relative"
                    >
                      <label htmlFor="confirmPassword" className="sr-only">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input-field"
                        placeholder="Confirm New Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className="submit-button"
                    >
                      {loading ? 'Updating Password...' : 'Reset Password'}
                    </button>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-4 text-center"
                  >
                    <Link href="/forgot-password" className="back-link">
                      Request a new reset link
                    </Link>
                  </motion.div>
                </form>
              ) : (
                <motion.div
                  className="no-token-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Link href="/forgot-password" className="back-to-login mt-6">
                    Go to password reset request
                  </Link>
                </motion.div>
              )}
            </>
          )
        )}
      </motion.div>
    </div>
  )
} 