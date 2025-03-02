'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import './home.css'
import NotificationsBox from '@/components/NotificationsBox'

export default function Home() {
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
    <div className="home-container">
      <Navbar title="Student Hub" />
      <main className="main-content">
        <div className="welcome-section">
          <h2 className="welcome-text">
            Welcome, {studentProfile?.full_name || user.email}
          </h2>
          <NotificationsBox />
        </div>
      </main>
    </div>
  )
}

