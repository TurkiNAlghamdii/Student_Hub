'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import './profile.css'

// Define the interface outside the component
interface StudentProfile {
  id: string
  created_at: string
  full_name: string
  student_id: string | number
  faculty: string
  email: string
  avatar_url?: string
}
  // auth_id removed since it doesn't exist in the database
  export default function Profile() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [updateMessage, setUpdateMessage] = useState('')
    const [formData, setFormData] = useState<Partial<StudentProfile>>({})
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!studentProfile) return
      
      try {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', studentProfile.id)
        
        if (error) throw error
        
        setStudentProfile({
          ...studentProfile,
          ...formData as StudentProfile
        })
        setIsEditing(false)
        setUpdateMessage('Profile updated successfully!')
        
        setTimeout(() => {
          setUpdateMessage('')
        }, 3000)
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unexpected error occurred')
        }
        setUpdateMessage('Failed to update profile')
      }
    }
  
  // Add this useEffect to clean up object URLs when component unmounts
    useEffect(() => {
      return () => {
        // Clean up any object URLs to prevent memory leaks
        if (studentProfile?.avatar_url) {
          URL.revokeObjectURL(studentProfile.avatar_url);
        }
      };
    }, [studentProfile?.avatar_url]);
    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploading(true)
        
        if (!event.target.files || event.target.files.length === 0) {
          return;
        }
  
        const file = event.target.files[0]
        
        // Create a temporary URL for immediate feedback
        const objectUrl = URL.createObjectURL(file)
        
        // Update the profile with the temporary URL for immediate display
        setStudentProfile(prev => prev ? {
          ...prev,
          avatar_url: objectUrl
        } : null)
        
        // Convert the file to a base64 string for storage in localStorage
        const reader = new FileReader()
        reader.readAsDataURL(file)
        
        reader.onload = async () => {
          if (reader.result) {
            // Store the base64 image data in localStorage
            const base64Image = reader.result.toString()
            if (user) {
              localStorage.setItem(`avatar_${user.id}`, base64Image)
              
              // Also update the student profile in the database with the avatar URL
              try {
                const { error } = await supabase
                  .from('students')
                  .update({ avatar_url: base64Image })
                  .eq('id', user.id)
                  
                if (error) {
                  console.error('Error updating avatar in database:', error)
                }
              } catch (dbError) {
                console.error('Database error:', dbError)
              }
            }
            
            setUpdateMessage('Avatar updated successfully!')
            
            setTimeout(() => {
              setUpdateMessage('')
            }, 3000)
          }
        }
        
        reader.onerror = (error) => {
          console.error('Error reading file:', error)
          throw new Error('Failed to process image')
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unexpected error occurred')
        }
        setUpdateMessage(`Error updating avatar: ${error instanceof Error ? error.message : 'Please try again later'}`)
      } finally {
        setUploading(false)
      }
    }
  
    const handleAvatarClick = () => {
      fileInputRef.current?.click()
    }
    useEffect(() => {
      const fetchStudentProfile = async () => {
        if (!user) return
  
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
          // Check if we have an avatar in localStorage (it might be more recent)
          const savedAvatar = localStorage.getItem(`avatar_${user.id}`)
          
          setStudentProfile({
            ...data,
            // Use localStorage avatar if available, otherwise use the one from the database
            avatar_url: savedAvatar || data.avatar_url
          })
          
          setFormData({
            full_name: data.full_name,
            student_id: data.student_id,
            faculty: data.faculty
          })
        } else {
          console.error('No student profile found for this user')
        }
        setLoading(false)
      }
      
      if (!authLoading) {
        if (!user) {
          router.push('/login')
        } else {
          fetchStudentProfile()
        }
      }
    }, [user, authLoading, router])
    if (authLoading || loading) {
      return <LoadingSpinner />
    }
    if (!user) return null
    
    // Display error message if there is one
    if (error && !updateMessage) {
      setUpdateMessage(`Error: ${error}`)
    }
    
    return (
      <div className="profile-container">
        <Navbar />
        <main className="flex justify-center p-6 pt-32">
          <div className="max-w-2xl w-full">
            <div className="profile-card">
              <h2 className="profile-title">My Information</h2>
              
              {updateMessage && (
                <div className={`update-message ${updateMessage.includes('Failed') ? 'error' : 'success'}`}>
                  {updateMessage}
                </div>
              )}
  
              {isEditing ? (
                <form className="edit-form" onSubmit={handleSubmit}>
                  <div className="profile-avatar">
                    <div className="avatar-upload" onClick={handleAvatarClick}>
                      {uploading ? (
                        <div className="uploading-indicator">Uploading...</div>
                      ) : studentProfile?.avatar_url ? (
                        <div className="avatar-container">
                          <Image 
                            src={studentProfile.avatar_url} 
                            alt="Profile" 
                            width={128} 
                            height={128} 
                            className="avatar-image"
                          />
                          <div className="avatar-overlay">
                            <span>Change</span>
                          </div>
                        </div>
                      ) : (
                        <div className="avatar-circle">
                          {studentProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                          <div className="avatar-overlay">
                            <span>Upload</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={uploadAvatar}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
  
                  <div className="form-group">
                    <label htmlFor="full_name">Name</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
  
                  <div className="form-group">
                    <label htmlFor="student_id">Student ID <span className="field-note">(Cannot be changed)</span></label>
                    <input
                      type="text"
                      id="student_id"
                      name="student_id"
                      value={formData.student_id || ''}
                      readOnly
                      disabled
                      className="disabled-input"
                      title="Student ID cannot be changed after registration"
                    />
                  </div>
  
                  <div className="form-group">
                    <label htmlFor="faculty">Faculty</label>
                    <select
                      id="faculty"
                      name="faculty"
                      value={formData.faculty || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Faculty</option>
                      <option value="Faculty of Computing">Faculty of Computing</option>
                      <option value="Faculty of Engineering">Faculty of Engineering</option>
                      <option value="Faculty of Science">Faculty of Science</option>
                      <option value="Faculty of Business">Faculty of Business</option>
                      <option value="Faculty of Medicine">Faculty of Medicine</option>
                    </select>
                  </div>
  
                  <button type="submit" className="save-button">Save Changes</button>
                </form>
              ) : (
                <div className="profile-content">
                  <div className="profile-avatar flex-col">
                    {studentProfile?.avatar_url ? (
                      <div className="avatar-container">
                        <Image 
                          src={studentProfile.avatar_url} 
                          alt="Profile" 
                          width={128} 
                          height={128} 
                          className="avatar-image"
                        />
                      </div>
                    ) : (
                      <div className="avatar-circle">
                        {studentProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </div>
                    )}
                    
                    <div className="mt-2 text-center">
                      <span 
                        className="text-emerald-400 cursor-pointer hover:text-emerald-300"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        Edit Profile
                      </span>
                    </div>
                  </div>
  
                  <div className="profile-details">
                    <div className="info-grid">
                      {studentProfile && (
                        <>
                          <div className="info-item">
                            <label>Name</label>
                            <p>{studentProfile.full_name}</p>
                          </div>
  
                          <div className="info-item">
                            <label>Student ID</label>
                            <p>{studentProfile.student_id}</p>
                          </div>
  
                          <div className="info-item">
                            <label>Faculty</label>
                            <p>{studentProfile.faculty}</p>
                          </div>
  
                          <div className="info-item">
                            <label>Email</label>
                            <p className="email-display">{user.email}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )  }
