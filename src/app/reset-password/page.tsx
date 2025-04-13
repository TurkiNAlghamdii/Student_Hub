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
  const [processingToken, setProcessingToken] = useState(true)
  const [hasValidToken, setHasValidToken] = useState(false)
  const [countdown, setCountdown] = useState(5) // Countdown timer for redirect (changed from 10 to 5)
  const router = useRouter()
  const { session, isPasswordRecovery } = useAuth()

  // Countdown timer effect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      // Only redirect when countdown reaches zero
      router.push('/login');
    }
  }, [success, countdown, router]);

  // Process the recovery token directly
  useEffect(() => {
    const processRecoveryToken = async () => {
      try {
        if (tokenProcessed) return;
        
        setProcessingToken(true);
        
        if (typeof window !== 'undefined') {
          const hashParams = window.location.hash;
          
          if (hashParams.includes('access_token') && hashParams.includes('type=recovery')) {
            setHasValidToken(true);

            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              if (error.message.includes('expired')) {
                setError('Your password reset link has expired. Please request a new one.');
                setHasValidToken(false);
              }
            } else if (!data.session) {
              try {
                const tokenMatch = hashParams.match(/access_token=([^&]+)/);
                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1];
                  
                  const { error: verifyError } = await supabase.auth.verifyOtp({
                    token_hash: token,
                    type: 'recovery',
                  });
                  
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
            router.push('/');
            return;
          } else if (!hashParams.includes('access_token')) {
            setError('No reset token found. Please request a password reset from the login page.');
            setHasValidToken(false);
            
            setTimeout(() => {
              router.push('/forgot-password');
            }, 3000);
          }
        }
        
        setTokenProcessed(true);
        setProcessingToken(false);
      } catch (err) {
        setError('An unexpected error occurred. Please try again or contact support if the issue persists.');
        setHasValidToken(true);
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
      // Validate password requirements
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
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

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
      
      if (data) {
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('Error signing out:', signOutErr);
        }
        
        setSuccess(true);
        
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during password reset';
      setError(`Error: ${errorMessage}`);
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
        
        {success ? (
          <motion.div
            className="success-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-4 flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p>Password successfully updated!</p>
            </div>
            <p className="text-gray-300 mb-3">Your password has been changed.</p>
            <p className="text-gray-400 mb-5">Please log in with your new password.</p>
            
            {/* Countdown timer */}
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gray-800/70 text-gray-300 text-sm py-2 px-5 rounded-full border border-emerald-500/30 flex items-center gap-2 shadow-lg shadow-emerald-900/10">
                <svg className="animate-spin h-4 w-4 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Redirecting to login in <span className="text-emerald-400 font-bold text-base">{countdown}</span> seconds</span>
              </div>
            </div>
            
            <div className="mt-4">
              <Link href="/login" className="inline-block px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all w-full text-center">
                Go to Login
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {processingToken ? (
              <motion.div
                className="processing-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="loader"></div>
                <p className="text-gray-300 mt-3">Processing your reset request...</p>
                <p className="text-xs text-gray-500 mt-2">This should only take a moment</p>
              </motion.div>
            ) : (
              <>
                {!hasValidToken ? (
                  <motion.div
                    className="info-message"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className={`rounded-lg p-4 mb-4 flex items-start gap-3 ${error?.includes('expired') ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {error?.includes('expired') ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      <div>
                        <p className="font-medium">{error || "Invalid or missing reset token"}</p>
                        <p className="text-sm mt-1 opacity-80">Please request a new password reset link.</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 text-center">You will be redirected in a few seconds...</p>
                    <Link href="/forgot-password" className="inline-block w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all text-center border border-gray-700/50">
                      Request a New Reset Link
                    </Link>
                  </motion.div>
                ) : (
                  <form className="login-form" onSubmit={handleResetPassword}>
                    {/* Password requirements help */}
                    <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/50 mb-6">
                      <p className="text-sm text-gray-300 mb-2 font-medium">Your password must:</p>
                      <ul className="text-xs text-gray-400 space-y-1 pl-1">
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-400' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${password.length >= 8 ? 'text-emerald-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={password.length >= 8 ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                          </svg>
                          Be at least 8 characters long
                        </li>
                        <li className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={/[A-Z]/.test(password) ? "M5 13l4 4L19 7" : "M12 4v16m8-8H4"} />
                          </svg>
                          Include at least one uppercase letter
                        </li>
                        <li className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-400' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${/[0-9]/.test(password) ? 'text-emerald-400' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <label htmlFor="password" className="block mb-2 text-sm">
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
                            <p className="text-xs text-gray-400 mt-1">
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
                        <label htmlFor="confirmPassword" className="block mb-2 text-sm">
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
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={password === confirmPassword ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                            </svg>
                            <p className={`text-xs ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
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
                          <p>{error}</p>
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
                      className="mt-6 text-center border-t border-gray-800 pt-4"
                    >
                      <p className="text-sm text-gray-400 mb-2">Having trouble?</p>
                      <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
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