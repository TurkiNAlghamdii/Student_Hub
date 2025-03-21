'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import RssSimple from '@/components/RssSimple/RssSimple'
import './home.css'
import NotificationsBox from '@/components/NotificationsBox'
import { 
  BookOpenIcon, 
  UserCircleIcon, 
  CalendarIcon, 
  BellIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [shortcutsReady, setShortcutsReady] = useState(false)

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
      
      // Ensure shortcuts animation starts after page content is loaded
      setTimeout(() => setShortcutsReady(true), 100)
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

  // Extract first name from full name or use email as fallback
  const getFirstName = () => {
    if (studentProfile?.full_name) {
      // Split the full name and take the first part as the first name
      return studentProfile.full_name.split(' ')[0];
    }
    // If no full name, use the part of the email before the @ symbol
    return user.email ? user.email.split('@')[0] : 'Student';
  }

  // Navigation shortcuts data
  const shortcuts = [
    {
      title: "Courses",
      description: "Browse your enrolled courses",
      icon: <BookOpenIcon className="shortcut-icon" />,
      path: "/courses"
    },
    {
      title: "Profile",
      description: "View and edit your profile",
      icon: <UserCircleIcon className="shortcut-icon" />,
      path: "/profile"
    },
    {
      title: "Events",
      description: "See upcoming events",
      icon: <CalendarIcon className="shortcut-icon" />,
      path: "/events"
    },
    {
      title: "Notifications",
      description: "View all notifications",
      icon: <BellIcon className="shortcut-icon" />,
      path: "/notifications"
    }
  ];

  // Rendering skeleton placeholders for shortcuts when not ready
  const renderSkeletonShortcuts = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="shortcut-skeleton">
        <div className="skeleton-icon"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
      </div>
    ));
  };

  return (
    <div className="home-container">
      <Navbar title="Student Hub" />
      <main className="main-content">
        <div className="welcome-section" style={{ zIndex: 20, position: 'relative' }}>
          <h2 className="welcome-text">
            Welcome, {getFirstName()}
          </h2>
          <div style={{ position: 'relative', zIndex: 50 }}>
            <NotificationsBox />
          </div>
        </div>
        
        <div className="shortcuts-section" style={{ zIndex: 10, position: 'relative' }}>
          <div className="shortcuts-grid">
            {!shortcutsReady ? renderSkeletonShortcuts() : (
              shortcuts.map((shortcut, index) => (
                <Link href={shortcut.path} key={index} legacyBehavior>
                  <a className="shortcut-item" aria-label={shortcut.title}>
                    <div className="shortcut-icon-container">
                      {shortcut.icon}
                    </div>
                    <h3 className="shortcut-title">{shortcut.title}</h3>
                    <p className="shortcut-description">{shortcut.description}</p>
                  </a>
                </Link>
              ))
            )}
          </div>
        </div>
        
        <div className="content-section">
          <div className="row">
            <div className="col">
              <RssSimple 
                url="https://rss.app/feeds/pcVOetZC9dx4E4dt.xml" 
                title="FCIT X Feed" 
                count={3}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

