/**
 * Profile Page Component
 * 
 * This client-side component provides a comprehensive user profile management system
 * that allows users to view and edit their personal information, change their password,
 * update their profile picture, and manage their account settings.
 * 
 * The component includes the following features:
 * - Profile information display and editing
 * - Profile picture upload and management
 * - Password change functionality
 * - Account deletion with security verification
 * - View mode for viewing other students' profiles
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class, ensuring
 * consistent styling across the application.
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import './profile.css'

/**
 * StudentProfile Interface
 * 
 * Defines the structure of a student profile in the application.
 * This interface is used for type checking and ensuring data consistency
 * when working with student profile information from the database.
 * 
 * @property id - Unique identifier for the student (UUID from Supabase Auth)
 * @property created_at - Timestamp when the profile was created
 * @property full_name - Student's full name
 * @property student_id - Student's university ID number
 * @property faculty - Student's faculty/department
 * @property email - Student's email address
 * @property avatar_url - Optional URL to the student's profile picture
 */
interface StudentProfile {
  id: string
  created_at: string
  full_name: string
  student_id: string | number
  faculty: string
  email: string
  avatar_url?: string
}
  /**
   * Profile Component
   * 
   * Main component for user profile management that handles both viewing and editing
   * of profile information, as well as account settings like password changes and
   * account deletion.
   * 
   * @returns The rendered profile page with appropriate state handling
   */
  export default function Profile() {
    // Navigation and routing hooks
    const router = useRouter()
    const searchParams = useSearchParams()
    const viewStudentId = searchParams.get('studentId')  // For viewing other students' profiles
    
    // Authentication context
    const { user, loading: authLoading, signOut } = useAuth()
    
    // Profile data and UI state
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)  // Current profile data
    const [loading, setLoading] = useState(true)  // Loading state for profile data
    const [isEditing, setIsEditing] = useState(false)  // Edit mode toggle
    const [isViewMode, setIsViewMode] = useState(false)  // View mode for other students' profiles
    const [updateMessage, setUpdateMessage] = useState('')  // Success/error messages
    const [formData, setFormData] = useState<Partial<StudentProfile>>({})  // Form data for editing
    const [error, setError] = useState<string | null>(null)  // Error state
    
    // Avatar upload state
    const [uploading, setUploading] = useState(false)  // Upload in progress indicator
    const fileInputRef = useRef<HTMLInputElement>(null)  // Reference to file input element
    
    // Account deletion state
    const [showDeleteModal, setShowDeleteModal] = useState(false)  // Delete confirmation modal
    const [isDeleting, setIsDeleting] = useState(false)  // Deletion in progress indicator
    const [password, setPassword] = useState('')  // Password for deletion confirmation
    
    // Password change state
    const [showPasswordModal, setShowPasswordModal] = useState(false)  // Password change modal
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })  // Password change form data
    const [isChangingPassword, setIsChangingPassword] = useState(false)  // Password change in progress
    const [passwordError, setPasswordError] = useState<string | null>(null)  // Password-specific errors
    
    // Password visibility state
    const [passwordVisibility, setPasswordVisibility] = useState({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    })  // Controls whether passwords are shown or hidden
    
    /**
     * Handles changes to form inputs when editing profile information
     * Updates the formData state with the new values
     * 
     * @param e - Change event from input or select elements
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    /**
     * Handles form submission when updating profile information
     * Sends the updated data to Supabase and updates the local state
     * 
     * @param e - Form submission event
     */
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Safety check to ensure profile exists
      if (!studentProfile) return
      
      try {
        // Update the student profile in the database
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', studentProfile.id)
        
        if (error) throw error
        
        // Update local state with the new profile data
        setStudentProfile({
          ...studentProfile,
          ...formData as StudentProfile
        })
        
        // Exit edit mode and show success message
        setIsEditing(false)
        setUpdateMessage('Profile updated successfully!')
        
        // Clear the success message after 3 seconds
        setTimeout(() => {
          setUpdateMessage('')
        }, 3000)
      } catch (error: unknown) {
        // Handle errors and provide feedback
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unexpected error occurred')
        }
        setUpdateMessage('Failed to update profile')
      }
    }
  
  /**
   * Cleanup effect for avatar object URLs
   * 
   * This effect ensures that any object URLs created for temporary avatar display
   * are properly revoked when the component unmounts or when the avatar changes,
   * preventing memory leaks in the application.
   */
    useEffect(() => {
      return () => {
        // Clean up any object URLs to prevent memory leaks
        if (studentProfile?.avatar_url && studentProfile.avatar_url.startsWith('blob:')) {
          URL.revokeObjectURL(studentProfile.avatar_url);
        }
      };
    }, [studentProfile?.avatar_url]);
    /**
     * Handles avatar image upload and processing
     * 
     * This function manages the avatar upload process including:
     * 1. Creating a temporary object URL for immediate display
     * 2. Converting the image to base64 for storage in Supabase
     * 3. Updating the database with the new avatar
     * 4. Providing user feedback throughout the process
     * 5. Error handling for various failure scenarios
     * 
     * The function uses FileReader to convert the image to base64 format,
     * which allows for efficient storage and retrieval from the database.
     * 
     * @param event - Change event from the file input element
     */
    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        // Set uploading state to show loading indicator
        setUploading(true)
        
        // Validate that files were selected
        if (!event.target.files || event.target.files.length === 0) {
          return;
        }
  
        const file = event.target.files[0]
        
        // Create a temporary URL for immediate visual feedback
        // This allows the user to see their new avatar before the upload completes
        const objectUrl = URL.createObjectURL(file)
        
        // Update the profile with the temporary URL for immediate display
        setStudentProfile(prev => prev ? {
          ...prev,
          avatar_url: objectUrl
        } : null)
        
        // Convert the file to a base64 string for storage in the database
        // Base64 encoding allows the image to be stored as a string
        const reader = new FileReader()
        reader.readAsDataURL(file)
        
        // Handle successful file reading
        reader.onload = async () => {
          if (reader.result) {
            // Get the base64 image data
            const base64Image = reader.result.toString()
            if (user) {
              // Update the student profile in the database with the avatar URL
              try {
                const { error } = await supabase
                  .from('students')
                  .update({ avatar_url: base64Image })
                  .eq('id', user.id)
                  
                if (error) {
                  console.error('Error updating avatar in database:', error)
                  throw error
                }
              } catch (dbError) {
                console.error('Database error:', dbError)
                throw dbError
              }
            }
            
            // Show success message
            setUpdateMessage('Avatar updated successfully!')
            
            // Clear success message after 3 seconds
            setTimeout(() => {
              setUpdateMessage('')
            }, 3000)
          }
        }
        
        // Handle file reading errors
        reader.onerror = (error) => {
          console.error('Error reading file:', error)
          throw new Error('Failed to process image')
        }
      } catch (error: unknown) {
        // Handle and display errors
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unexpected error occurred')
        }
        setUpdateMessage(`Error updating avatar: ${error instanceof Error ? error.message : 'Please try again later'}`)
      } finally {
        // Reset uploading state regardless of outcome
        setUploading(false)
      }
    }
  
    /**
     * Handles clicks on the avatar image
     * 
     * Triggers the hidden file input to open the file selection dialog
     * when the user clicks on their avatar image. This provides a more
     * intuitive user experience than requiring users to click a separate button.
     */
    const handleAvatarClick = () => {
      fileInputRef.current?.click()
    }
    useEffect(() => {
      const fetchStudentProfile = async () => {
        if (!user && !viewStudentId) return

        // If viewStudentId is provided, we're in view mode
        if (viewStudentId) {
          setIsViewMode(true)
          
          // Fetch the student profile using the studentId from URL
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('student_id', viewStudentId)
            .single()

          if (error) {
            console.error('Failed to fetch student profile:', error)
            setError('Student profile not found')
          }

          if (data) {
            setStudentProfile(data)
          } else {
            setError('Student profile not found')
          }
          
          setLoading(false)
          return
        }

        // Regular profile fetch for the logged-in user
        if (user) {
          // Fetch the student profile using the id from auth
          const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Failed to fetch student profile:', error)
          }

          if (data) {
            setStudentProfile({
              ...data,
              // Use only the database avatar
              avatar_url: data.avatar_url
            })
            
            setFormData({
              full_name: data.full_name,
              student_id: data.student_id,
              faculty: data.faculty,
              email: data.email
            })
          } else {
            console.error('No student profile found for this user')
          }
        }
        
        setLoading(false)
      }
      
      if (!authLoading) {
        if (!user && !viewStudentId) {
          router.push('/login')
        } else {
          fetchStudentProfile()
        }
      }
    }, [user, authLoading, router, viewStudentId])

    // Show centered spinner if auth or profile data is loading
    if (authLoading || loading) {
      // Wrap the spinner in the standard fixed centering container
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0">
          <LoadingSpinner size="xlarge" /> 
        </div>
      );
    }

    // If auth is done, loading is done, but no user, render nothing (redirect should handle)
    if (!user) return null
    
    // --- If we get here, !authLoading, !loading, and user exists --- 

    // Add new function to handle account deletion
    const handleDeleteAccount = async () => {
      if (!password.trim()) {
        setError('Please enter your password to confirm')
        return
      }
      
      if (!user) {
        setError('You must be logged in to delete your account')
        return
      }
      
      try {
        setIsDeleting(true)
        setError(null)
        
        console.log('Starting account deletion process');
        
        // First verify the password is correct
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email || '',
          password: password
        });
        
        if (signInError) {
          console.error('Password verification failed:', signInError);
          throw new Error('Incorrect password. Please try again.');
        }
        
        // Call the API to delete the account - simplified to only use the user ID
        const response = await fetch('/api/user/account', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id
          },
          body: JSON.stringify({
            password: password
          })
        })
        
        // Handle the response
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('Account deletion failed:', response.status, responseData);
          throw new Error(responseData.error || `Failed to delete account (${response.status})`)
        }
        
        console.log('Account deletion successful:', responseData);
        
        // Sign out the user locally
        await signOut()
        
        // Redirect to the home page
        router.push('/?message=Account deleted successfully')
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        console.error('Delete account error:', error)
        setError(errorMessage)
        setIsDeleting(false)
      }
    }

    // Add password change handling function
    const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!user) {
        setPasswordError('You must be logged in to change your password')
        return
      }
      
      // Validate inputs
      if (!passwordData.currentPassword.trim()) {
        setPasswordError('Please enter your current password')
        return
      }
      
      if (passwordData.newPassword.length < 6) {
        setPasswordError('New password must be at least 6 characters long')
        return
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match')
        return
      }
      
      try {
        setIsChangingPassword(true)
        setPasswordError(null)
        
        // First verify the current password is correct
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email || '',
          password: passwordData.currentPassword
        })
        
        if (signInError) {
          throw new Error('Current password is incorrect')
        }
        
        // Update the password
        const { error: updateError } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        })
        
        if (updateError) {
          throw new Error(updateError.message)
        }
        
        // Reset the form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        
        // Close the modal
        setShowPasswordModal(false)
        
        // Show success message
        setUpdateMessage('Password updated successfully!')
        
        setTimeout(() => {
          setUpdateMessage('')
        }, 3000)
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
        setPasswordError(errorMessage)
      } finally {
        setIsChangingPassword(false)
      }
    }
    
    const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setPasswordData(prev => ({ ...prev, [name]: value }))
    }

    return (
      <div className="profile-container min-h-screen bg-gradient-to-b from-background to-background/70">
        <Navbar />
        <main className="flex justify-center p-4 pt-28 sm:p-6 sm:pt-32">
          <div className="max-w-5xl w-full">
            <div className="profile-header-card mb-8">
              <h1 className="profile-main-title">
                {isViewMode ? 'Student Profile' : 'My Profile'}
              </h1>
              <p className="profile-subtitle">
                {isViewMode 
                  ? `Viewing ${studentProfile?.full_name || 'Student'}'s profile information`
                  : 'Manage your personal information and account settings'
                }
              </p>
            </div>
            
            {/* Profile Card with centered layout */}
            <div className="profile-card md:max-w-3xl w-full shadow-md dark:shadow-gray-800/10 mx-auto">
              <div className="relative mb-6">
                <h2 className="profile-title">Personal Information</h2>
                {!isEditing && !isViewMode && (
                  <button 
                    className="edit-profile-button-corner absolute top-0 right-0"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                    </svg>
                  </button>
                )}
              </div>
              
              {updateMessage && !isViewMode && (
                <div className={`update-message ${updateMessage.includes('Failed') ? 'error' : 'success'} mb-4`}>
                  {updateMessage}
                </div>
              )}

              {error && !showDeleteModal && (
                <div className="error-message mb-4">
                  {error}
                </div>
              )}

              {isEditing ? (
                <form className="edit-form" onSubmit={handleSubmit}>
                  {/* Centered Profile Picture */}
                  <div className="flex justify-center mb-8">
                    <div className="avatar-upload cursor-pointer group relative" onClick={handleAvatarClick}>
                      {uploading ? (
                        <div className="uploading-indicator flex items-center justify-center h-32 w-32 bg-gray-200 dark:bg-gray-800 rounded-full">
                          <LoadingSpinner size="small" />
                        </div>
                      ) : studentProfile?.avatar_url ? (
                        <div className="avatar-container relative">
                          <Image 
                            src={studentProfile.avatar_url} 
                            alt="Profile" 
                            width={128} 
                            height={128} 
                            className="avatar-image rounded-full object-cover h-32 w-32"
                          />
                          <div className="avatar-overlay absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200">
                            <span>Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="avatar-circle">
                          {studentProfile?.full_name ? studentProfile.full_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id="avatar"
                      className="hidden"
                      accept="image/*"
                      onChange={uploadAvatar}
                      ref={fileInputRef}
                    />
                  </div>

                  {/* Grid Layout for Form Fields */}
                  <div className="info-grid">
                    <div className="info-item">
                      <label htmlFor="full_name">Name</label>
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={formData.full_name || ''}
                        onChange={handleChange}
                        required
                        className="w-full p-2"
                      />
                    </div>

                    <div className="info-item">
                      <label htmlFor="student_id">Student ID</label>
                      <input
                        type="text"
                        id="student_id"
                        name="student_id"
                        value={formData.student_id || ''}
                        onChange={handleChange}
                        required
                        className="w-full p-2"
                      />
                    </div>

                    <div className="info-item">
                      <label htmlFor="faculty">Faculty</label>
                      <select
                        id="faculty"
                        name="faculty"
                        value={formData.faculty || ''}
                        onChange={handleChange}
                        required
                        className="w-full p-2"
                      >
                        <option value="">Select Faculty</option>
                        <option value="Faculty of Computing">Faculty of Computing</option>
                        <option value="Faculty of Engineering">Faculty of Engineering</option>
                        <option value="Faculty of Science">Faculty of Science</option>
                        <option value="Faculty of Business">Faculty of Business</option>
                        <option value="Faculty of Medicine">Faculty of Medicine</option>
                      </select>
                    </div>

                    <div className="info-item email-container">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={studentProfile?.email || ''}
                        disabled
                        className="w-full p-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)} 
                      className="cancel-edit-button flex-1 py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="save-button flex-1 bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  {/* Centered Profile Avatar */}
                  <div className="flex justify-center mb-8">
                    {studentProfile?.avatar_url ? (
                      <div className="avatar-container">
                        <Image 
                          src={studentProfile.avatar_url} 
                          alt="Profile" 
                          width={128} 
                          height={128} 
                          className="avatar-image rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="avatar-circle">
                        {studentProfile?.full_name ? studentProfile.full_name.charAt(0).toUpperCase() : 'S'}
                      </div>
                    )}
                  </div>

                  {/* Profile Information Grid */}
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Name</label>
                      <p>{studentProfile?.full_name || 'Not provided'}</p>
                    </div>

                    <div className="info-item">
                      <label>Student ID</label>
                      <p>{studentProfile?.student_id || 'Not provided'}</p>
                    </div>

                    <div className="info-item">
                      <label>Faculty</label>
                      <p>{studentProfile?.faculty || 'Not provided'}</p>
                    </div>

                    <div className="info-item email-container">
                      <label>Email</label>
                      <p>{studentProfile?.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Account Management Section */}
            {!isViewMode && (
              <div className="mt-6">
                <div className="profile-card md:max-w-3xl w-full shadow-md dark:shadow-gray-800/10 mx-auto">
                  <div className="relative mb-6">
                    <h2 className="profile-title">Account Management</h2>
                  </div>
                  
                  <div className="account-management-grid">
                    {/* Security Settings Box */}
                    <div className="account-box">
                      <h3 className="account-box-title">Security Settings</h3>
                      <p className="account-box-description">
                        Manage your account password and security preferences
                      </p>
                      <button 
                        className="change-password-button"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Change Password
                      </button>
                    </div>
                    
                    {/* Danger Zone Box */}
                    <div className="account-box danger">
                      <h3 className="account-box-title danger-title">Danger Zone</h3>
                      <p className="account-box-description">
                        Permanently delete your account and all associated data
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="delete-account-button"
                        type="button"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="privacy-notes mt-8">
              <p className="text-sm">
                We respect your privacy. Your personal information is securely stored and will never be shared with third parties.
              </p>
            </div>
          </div>
        </main>
        
        {/* Modals */}
        {showPasswordModal && (
          <div className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="password-modal">
              <h3>Change Password</h3>
              
              {passwordError && (
                <div className="error-message mb-4">
                  {passwordError}
                </div>
              )}
              
              <form onSubmit={handlePasswordChange}>
                <div className="form-group mb-4">
                  <label htmlFor="currentPassword">
                    Current Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={passwordVisibility.currentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-button" 
                      onClick={() => setPasswordVisibility(prev => ({
                        ...prev,
                        currentPassword: !prev.currentPassword
                      }))}
                      aria-label={passwordVisibility.currentPassword ? "Hide password" : "Show password"}
                    >
                      {passwordVisibility.currentPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="form-group mb-4">
                  <label htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={passwordVisibility.newPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      required
                      minLength={6}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-button" 
                      onClick={() => setPasswordVisibility(prev => ({
                        ...prev,
                        newPassword: !prev.newPassword
                      }))}
                      aria-label={passwordVisibility.newPassword ? "Hide password" : "Show password"}
                    >
                      {passwordVisibility.newPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="form-group mb-6">
                  <label htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <div className="password-input-container">
                    <input
                      type={passwordVisibility.confirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      required
                    />
                    <button 
                      type="button" 
                      className="password-toggle-button" 
                      onClick={() => setPasswordVisibility(prev => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword
                      }))}
                      aria-label={passwordVisibility.confirmPassword ? "Hide password" : "Show password"}
                    >
                      {passwordVisibility.confirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      })
                      setPasswordError(null)
                    }}
                    className="cancel-button"
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Updating...</span>
                      </span>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {showDeleteModal && (
          <div className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="delete-modal bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-red-500 mb-4">Delete Account</h3>
              
              {error && (
                <div className="error-message p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 mb-4">
                  {error}
                </div>
              )}
              
              <p className="mb-6 text-gray-300">
                This action <span className="font-bold">cannot be undone</span>. This will permanently delete your account and all your data.
              </p>
              
              <p className="mb-4 text-gray-300">
                To confirm, please enter your password:
              </p>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="delete-confirmation-input w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-red-500 focus:border-red-500 transition duration-200"
              />
              
              <div className="flex mt-6 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setPassword('')
                    setError(null)
                  }}
                  className="cancel-delete-button bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg border border-gray-700 transition-all duration-200 flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="confirm-delete-button bg-red-500/80 hover:bg-red-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDeleting || !password.trim()}
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Deleting...</span>
                    </span>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )  }
