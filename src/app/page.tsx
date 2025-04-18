'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import RssSimple from '@/components/RssSimple/RssSimple'
import CourseWidget from '@/components/CourseWidget/CourseWidget'
import AIAssistantWidget from '@/components/AIAssistantWidget/AIAssistantWidget'
import SalaryCounterWidget from '@/components/SalaryCounterWidget/SalaryCounterWidget'
import StudentCountWidget from '@/components/StudentCountWidget/StudentCountWidget'
import Footer from '@/components/Footer/Footer'
import './home.css'
import NotificationsBox from '@/components/NotificationsBox'
import { 
  BookOpenIcon, 
  UserCircleIcon, 
  CalendarIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// Define the student profile interface
interface StudentProfile {
  id: string
  full_name?: string
  email?: string
  department?: string
  major?: string
  level?: number
  gpa?: number
  credits_earned?: number
  enrollment_status?: string
  graduation_year?: number
  student_id?: string
  // Extend this interface with other specific properties as needed
}

export default function Home() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [shortcutsReady, setShortcutsReady] = useState(false)

  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) {
        setLoading(false);
        return
      }

      try {
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()
        setStudentProfile(data)
        if (data) { 
          setTimeout(() => setShortcutsReady(true), 100)
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        fetchStudentProfile()
      }
    } else {
      setLoading(true);
    }
  }, [user, authLoading, router])

  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0">
        <LoadingSpinner size="xlarge" /> 
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  const getFirstName = () => {
    if (studentProfile?.full_name) {
      return studentProfile.full_name.split(' ')[0];
    }
    return user.email ? user.email.split('@')[0] : 'Student';
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

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
      title: "Academic Calendar",
      description: "View and download academic calendars",
      icon: <CalendarIcon className="shortcut-icon" />,
      path: "/academic-calendar"
    },
    {
      title: "Events",
      description: "See upcoming events",
      icon: <CalendarIcon className="shortcut-icon" />,
      path: "/events"
    },
    {
      title: "AI Chat",
      description: "Get intelligent assistance",
      icon: <ChatBubbleLeftRightIcon className="shortcut-icon" />,
      path: "/chat"
    },
    {
      title: "ODUS Plus",
      description: "Access KAU ODUS Plus Portal",
      icon: <AcademicCapIcon className="shortcut-icon" />,
      path: "https://iam.kau.edu.sa/oamsso-bin/kaulogin.pl?resource_url=https%3A%2F%2Fodusplus-ss.kau.edu.sa%252Fprod%252Ftwbkwbis.p_wwwlogin",
      external: true
    },
    {
      title: "Blackboard",
      description: "Access KAU Blackboard LMS",
      icon: <ComputerDesktopIcon className="shortcut-icon" />,
      path: "https://iam.kau.edu.sa/oamsso-bin/kaulogin-fed.pl?contextType=external&username=string&OverrideRetryLimit=0&password=secure_string&challenge_url=%2Foamsso-bin%2Fkaulogin-fed.pl&request_id=1602137698833632064&authn_try_count=0&locale=en_US&resource_url=%252Fuser%252Floginsso",
      external: true
    }
  ];

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
      <Navbar />
      <main className="main-content">
        <div className="welcome-section">
          <div className="welcome-container">
            <div className="greeting-content">
              <div className="greeting-icon">
                {new Date().getHours() < 12 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                ) : new Date().getHours() < 18 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="greeting-text">
                <h2 className="welcome-text">
                  {getTimeBasedGreeting()}, <span className="user-name">{getFirstName()}</span>
                </h2>
                <p className="welcome-subtext">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="welcome-actions">
              <div className="notification-container">
                <NotificationsBox />
              </div>
            </div>
          </div>
        </div>
        
        <div className="shortcuts-section" style={{ zIndex: 10, position: 'relative' }}>
          <div className="shortcuts-grid">
            {!shortcutsReady ? renderSkeletonShortcuts() : (
              shortcuts.map((shortcut, index) => (
                shortcut.external ? (
                  <a 
                    href={shortcut.path} 
                    key={index} 
                    className="shortcut-item" 
                    aria-label={shortcut.title}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="shortcut-icon-container">
                      {shortcut.icon}
                    </div>
                    <h3 className="shortcut-title">{shortcut.title}</h3>
                    <p className="shortcut-description">{shortcut.description}</p>
                  </a>
                ) : (
                  <Link href={shortcut.path} key={index} legacyBehavior>
                    <a className="shortcut-item" aria-label={shortcut.title}>
                      <div className="shortcut-icon-container">
                        {shortcut.icon}
                      </div>
                      <h3 className="shortcut-title">{shortcut.title}</h3>
                      <p className="shortcut-description">{shortcut.description}</p>
                    </a>
                  </Link>
                )
              ))
            )}
          </div>
        </div>
        
        <div className="content-section">
          <div className="row">
            <div className="col">
              <CourseWidget />
            </div>
            <div className="col">
              <AIAssistantWidget />
            </div>
          </div>
          <div className="row mt-6">
            <div className="col">
              <SalaryCounterWidget />
            </div>
            <div className="col">
              <StudentCountWidget />
            </div>
          </div>
          <div className="row mt-6">
            <div className="col">
              <RssSimple 
                url="https://rss.app/feeds/pcVOetZC9dx4E4dt.xml" 
                title="FCIT X Feed" 
                count={3}
              />
            </div>
            <div className="col">
              {/* Empty column to maintain grid layout */}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
