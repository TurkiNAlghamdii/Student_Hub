'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import './profile.css'

export default function Profile() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) return

      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()

      setStudentProfile(data)
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
      <Navbar title="Profile" showBack />
      <main className="main-content">
        <div className="profile-card">
          <h2 className="profile-title">User Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <p>{user.email}</p>
            </div>

            {studentProfile && (
              <>
                <div className="info-item">
                  <label>Full Name</label>
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 