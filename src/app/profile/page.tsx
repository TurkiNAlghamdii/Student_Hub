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
  auth_id: string
  full_name: string
  student_id: string
  faculty: string
  avatar_url?: string
}

export default function Profile() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')
  const [formData, setFormData] = useState<Partial<StudentProfile>>({})
  const [uploading, setUploading] = useState(false)
  
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
    } catch (error) {
      console.error('Error updating profile:', error)
      setUpdateMessage('Failed to update profile')
    }
  }

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return

      // First try with auth_id
      let { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      // If no data found, try with id
      if (!data && error) {
        const result = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()
        
        data = result.data
        error = result.error
      }

      if (data) {
        setStudentProfile(data)
        setFormData({
          full_name: data.full_name,
          student_id: data.student_id,
          faculty: data.faculty
        })
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

  return (
    <div className="profile-container">
      <Navbar title="Student Profile" showBack={true} />
      <main className="flex justify-center items-center p-6">
        <div className="max-w-2xl w-full">
          <div className="profile-card">
            <h2 className="profile-title">My Information</h2>
            
            <div className="profile-header">
              <button 
                className="edit-button"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {updateMessage && (
              <div className={`update-message ${updateMessage.includes('Failed') ? 'error' : 'success'}`}>
                {updateMessage}
              </div>
            )}

            {isEditing ? (
              <form className="edit-form" onSubmit={handleSubmit}>
                <div className="profile-avatar">
                  {studentProfile?.avatar_url ? (
                    <div className="avatar-container">
                      <Image 
                        src={studentProfile.avatar_url} 
                        alt="Profile" 
                        width={96} 
                        height={96} 
                        className="avatar-image"
                      />
                    </div>
                  ) : (
                    <div className="avatar-circle">
                      {studentProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                  )}
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
                  <label htmlFor="student_id">Student ID</label>
                  <input
                    type="text"
                    id="student_id"
                    name="student_id"
                    value={formData.student_id || ''}
                    onChange={handleChange}
                    required
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
                <div className="profile-avatar">
                  {studentProfile?.avatar_url ? (
                    <div className="avatar-container">
                      <Image 
                        src={studentProfile.avatar_url} 
                        alt="Profile" 
                        width={96} 
                        height={96} 
                        className="avatar-image"
                      />
                    </div>
                  ) : (
                    <div className="avatar-circle">
                      {studentProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                    </div>
                  )}
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

                        <div className="info-item email">
                          <label>Email</label>
                          <p>{user.email}</p>
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
  )
}