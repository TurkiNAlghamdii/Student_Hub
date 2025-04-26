/**
 * Register Page Component
 * 
 * This client-side component provides a user registration system for the Student Hub application.
 * It handles account creation for both students and faculty members with appropriate validation
 * and different registration flows based on email domain.
 * 
 * Key features:
 * - Email domain validation (only KAU domains allowed)
 * - Password strength validation with visual feedback
 * - Different registration flows for students vs. faculty/staff
 * - Comprehensive error handling and user feedback
 * - Integration with Supabase Auth for account creation
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class, ensuring
 * consistent styling and preventing flash of incorrect theme during navigation.
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle'
import './register.css'
/**
 * Constants for registration validation
 * 
 * ALLOWED_DOMAINS - List of email domains that are allowed to register
 * FACULTIES - List of faculties available for student registration
 * 
 * These constants are used for validation and providing options in the registration form.
 * Only users with email addresses from the allowed domains can register for an account.
 */
const ALLOWED_DOMAINS = ['@stu.kau.edu.sa', '@kau.edu.sa']
const FACULTIES = ['Faculty of Computing', 'Faculty of Engineering', 'Faculty of Science']

/**
 * Register Component
 * 
 * Main component for user registration that handles form state, validation,
 * and submission to create new user accounts in the system.
 * 
 * @returns The rendered registration form with appropriate state handling
 */
export default function Register() {
  // Form input states
  const [email, setEmail] = useState('')                    // User email address
  const [password, setPassword] = useState('')              // User password
  const [confirmPassword, setConfirmPassword] = useState('') // Password confirmation
  const [studentId, setStudentId] = useState('')            // Student ID (for students only)
  const [fullName, setFullName] = useState('')              // User's full name
  const [faculty, setFaculty] = useState('')                // User's faculty (for students only)
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)             // Toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false) // Toggle confirm password visibility
  const [error, setError] = useState<string | null>(null)              // Error messages
  const [loading, setLoading] = useState(false)                        // Loading state during registration
  const [isStudent, setIsStudent] = useState(false)                    // Whether the user is a student (based on email domain)
  
  // Hooks
  const router = useRouter()
  const { theme } = useTheme()  // Current theme from ThemeContext

  /**
   * Effect to detect student status based on email domain
   * 
   * This automatically determines if the user is a student based on their email domain
   * and updates the form accordingly to show or hide student-specific fields.
   */
  useEffect(() => {
    if (email.includes('@')) {
      const domain = email.substring(email.indexOf('@'))
      setIsStudent(domain === '@stu.kau.edu.sa')  // Student emails have the @stu.kau.edu.sa domain
    }
  }, [email])

  /**
   * Validates that the email domain is allowed for registration
   * 
   * Checks if the email domain is in the list of allowed domains (KAU domains only)
   * to ensure only authorized users can register for an account.
   * 
   * @param email - The email address to validate
   * @returns Boolean indicating if the email domain is allowed
   */
  const validateEmail = (email: string) => {
    const domain = email.substring(email.indexOf('@'))
    return ALLOWED_DOMAINS.includes(domain)
  }

  /**
   * Validates password strength against security requirements
   * 
   * Checks if the password meets all security requirements including:
   * - Minimum length
   * - Contains uppercase letters
   * - Contains lowercase letters
   * - Contains numbers
   * - Contains special characters
   * 
   * @param password - The password to validate
   * @returns Object with isValid flag and array of specific errors if any
   */
  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    
    // Check each requirement and add specific error messages
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

  /**
   * Handles the registration form submission
   * 
   * This function performs the following steps:
   * 1. Validates all form inputs (email domain, required fields, password strength)
   * 2. Creates a new user in Supabase Auth
   * 3. Creates the appropriate profile record (student or faculty) in the database
   * 4. Redirects to login page with success message or displays error
   * 
   * The function implements different validation and database operations
   * based on whether the user is registering as a student or faculty/staff.
   * 
   * @param e - Form submission event
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)  // Clear any previous errors

    // Step 1: Validate email domain
    if (!validateEmail(email)) {
      setError('Only KAU email addresses are allowed')
      return
    }

    // Step 2: Validate required fields based on user type
    if (isStudent) {
      // Student-specific validation
      if (!fullName || !faculty || !studentId) {
        setError('All fields are required for student registration')
        return
      }
    } else {
      // Faculty/staff validation
      if (!fullName) {
        setError('Full name is required for faculty/staff registration')
        return
      }
    }

    // Step 3: Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      setError(`Password requirements: ${passwordValidation.errors.join(', ')}`)
      return
    }

    // Step 4: Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // All validation passed, proceed with registration
    setLoading(true)

    try {
      // Step 5: Create auth user in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError

      // Step 6: Create appropriate profile record based on user type
      if (isStudent && authData.user) {
        // Create student profile
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
      else if (authData.user) {
        // Create faculty/staff profile
        const { error: profileError } = await supabase
          .from('faculty_members')
          .insert([
            {
              id: authData.user.id,
              full_name: fullName,
              email: email
            }
          ])

        if (profileError) throw profileError
      }

      // Step 7: Redirect to login page with success message
      router.push('/login?message=Check your email to confirm your account')
    } catch (error: unknown) {
      // Handle and display errors
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during registration');
      }
    } finally {
      setLoading(false)  // Reset loading state regardless of outcome
    }
  }

  /**
   * Calculates password strength for visual indicator
   * 
   * Determines the width and color of the password strength indicator
   * based on how many validation criteria the password meets.
   * 
   * @param password - The password to evaluate
   * @returns Object with width (percentage) and color class for the strength indicator
   */
  const getPasswordStrength = (password: string) => {
    if (!password) return { width: '0%', color: 'bg-gray-200' }  // Empty password
    
    const validation = validatePassword(password)
    const errors = validation.errors.length
    
    // Return appropriate width and color based on number of errors
    if (errors === 0) return { width: '100%', color: 'bg-green-500' }  // Strong password (all criteria met)
    if (errors <= 2) return { width: '75%', color: 'bg-yellow-500' }   // Medium-strong password
    if (errors <= 4) return { width: '50%', color: 'bg-orange-500' }   // Medium-weak password
    return { width: '25%', color: 'bg-red-500' }                        // Weak password
  }

  // Calculate current password strength for the indicator
  const passwordStrength = getPasswordStrength(password)

  /**
   * Render the registration form with animations and theme support
   * The component uses CSS classes that adapt to both light and dark themes
   * through the application's theme system (via ThemeContext)
   */
  return (
    <div className="register-container">
      {/* Mini Nav for Public Links and Theme Toggle */}
      <motion.div 
        className="register-public-nav" 
        key="register-nav"
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
            {isStudent ? (
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
            ) : email.includes('@kau.edu.sa') && (
              // Faculty/Staff information - Only shown for faculty emails
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
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
