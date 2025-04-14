'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import './register.css'

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

const ALLOWED_DOMAINS = ['@stu.kau.edu.sa', '@kau.edu.sa']
const FACULTIES = ['Faculty of Computing', 'Faculty of Engineering', 'Faculty of Science']

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [studentId, setStudentId] = useState('')
  const [fullName, setFullName] = useState('')
  const [faculty, setFaculty] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isStudent, setIsStudent] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    const domain = email.substring(email.indexOf('@'))
    setIsStudent(domain === '@stu.kau.edu.sa')
  }, [email])

  const validateEmail = (email: string) => {
    const domain = email.substring(email.indexOf('@'))
    return ALLOWED_DOMAINS.includes(domain)
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    
    if (password.length < minLength) {
      errors.push(`At least ${minLength} characters`)
    }
    if (!hasUpperCase) {
      errors.push('One uppercase letter')
    }
    if (!hasLowerCase) {
      errors.push('One lowercase letter')
    }
    if (!hasNumbers) {
      errors.push('One number')
    }
    if (!hasSpecialChar) {
      errors.push('One special character')
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate email domain
    if (!validateEmail(email)) {
      setError('Only KAU email addresses are allowed')
      return
    }

    // Validate student information if student email
    if (isStudent) {
      if (!fullName || !faculty || !studentId) {
        setError('All fields are required for student registration')
        return
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(`Password requirements: ${passwordValidation.errors.join(', ')}`)
      return
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      // If student, create student record using the UUID from auth
      if (isStudent && authData.user) {
        const { error: profileError } = await supabase
          .from('students')
          .insert([
            {
              id: authData.user.id,
              student_id: studentId,
              full_name: fullName,
              faculty: faculty,
              email: email
            }
          ])

        if (profileError) throw profileError
      }

      router.push('/login?message=Check your email to confirm your account')
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during registration');
      }
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { width: '0%', color: 'bg-gray-200' }
    
    const validation = validatePassword(password)
    const errors = validation.errors.length
    
    if (errors === 0) return { width: '100%', color: 'bg-green-500' }
    if (errors <= 2) return { width: '75%', color: 'bg-yellow-500' }
    if (errors <= 4) return { width: '50%', color: 'bg-orange-500' }
    return { width: '25%', color: 'bg-red-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="register-container">
      <ThemeToggle />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="register-card"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="register-title"
        >
          Register
        </motion.h1>
        <form className="register-form" onSubmit={handleRegister}>
          <div className="input-container">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="KAU Email address"
              />
            </motion.div>

            {/* Student Information - Only shown for student emails */}
            {isStudent && (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                    className="input-field"
                    placeholder="Student ID"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    placeholder="Full Name"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <select
                    required
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Faculty</option>
                    {FACULTIES.map((fac) => (
                      <option key={fac} value={fac}>
                        {fac}
                      </option>
                    ))}
                  </select>
                </motion.div>
              </>
            )}

            {/* Password Fields */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isStudent ? 0.7 : 0.4 }}
              className="relative"
            >
              <input
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
              {password && (
                <div className="password-strength-container">
                  <div 
                    className={`password-strength-bar ${passwordStrength.color}`}
                    style={{ width: passwordStrength.width }}
                  />
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: isStudent ? 0.8 : 0.5 }}
              className="relative"
            >
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm Password"
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
            transition={{ delay: isStudent ? 0.9 : 0.6 }}
          >
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </motion.div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isStudent ? 1.0 : 0.7 }}
          className="login-link-text"
        >
          Already have an account?{' '}
          <Link href="/login" className="login-link">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
