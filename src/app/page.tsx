/**
 * Home Page Component
 * 
 * This client-side component serves as the main dashboard for authenticated users
 * in the Student Hub application. It provides a personalized welcome experience,
 * quick access to important resources, and various widgets with useful information.
 * 
 * Key features:
 * - Personalized greeting based on time of day and user's name
 * - Quick access shortcuts to frequently used resources
 * - Dashboard widgets for courses, AI assistant, statistics, and news
 * - Responsive layout that adapts to different screen sizes
 * - Authentication protection with automatic redirect to login
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class. The styling
 * uses dark: prefixed classes for dark mode styling, ensuring consistent appearance
 * and preventing flash of incorrect theme during navigation.
 */

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

/**
 * Student Profile Interface
 * 
 * Defines the structure of a student profile object retrieved from the database.
 * This interface ensures type safety when working with student data throughout
 * the application. All properties except 'id' are optional to accommodate
 * incomplete profiles or different stages of profile completion.
 * 
 * @property id - Unique identifier for the student (matches auth user id)
 * @property full_name - Student's full name
 * @property email - Student's email address
 * @property department - Student's academic department
 * @property major - Student's field of study
 * @property level - Academic level/year
 * @property gpa - Current Grade Point Average
 * @property credits_earned - Number of credits completed
 * @property enrollment_status - Current enrollment status (active, on leave, etc.)
 * @property graduation_year - Expected graduation year
 * @property student_id - University-assigned student ID
 */
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

/**
 * Home Component
 * 
 * Main dashboard component for authenticated users. This component handles:
 * 1. Authentication state and redirects
 * 2. Fetching the student profile data
 * 3. Rendering a personalized dashboard with widgets and shortcuts
 * 4. Providing a responsive and theme-aware user interface
 * 
 * @returns The rendered home page dashboard
 */
export default function Home() {
  const router = useRouter()                                  // Next.js router for navigation
  const { user, loading: authLoading } = useAuth()           // Authentication context for user state
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)  // Student profile data
  const [loading, setLoading] = useState(true)               // Loading state for profile data
  const [shortcutsReady, setShortcutsReady] = useState(false)  // State to control shortcuts animation

  /**
   * Student Profile Fetch Effect
   * 
   * This effect handles fetching the student profile data from Supabase
   * when the component mounts or when the authentication state changes.
   * It also handles redirecting unauthenticated users to the login page.
   * 
   * The effect performs several key functions:
   * 1. Checks if the user is authenticated
   * 2. Fetches the student profile data from the database
   * 3. Updates the loading states and profile data
   * 4. Handles the animation timing for shortcuts
   * 5. Redirects unauthenticated users to login
   */
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!user) {
        setLoading(false);
        return
      }

      try {
        // Fetch student profile data from Supabase
        const { data } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single()
        setStudentProfile(data)
        
        // Delay showing shortcuts for a smoother loading experience
        if (data) { 
          setTimeout(() => setShortcutsReady(true), 100)
        }
      } catch (error) {
        console.error("Error fetching student profile:", error);
      } finally {
        setLoading(false)
      }
    }

    // Handle authentication state
    if (!authLoading) {
      if (!user) {
        // Redirect to landing page if not authenticated
        router.push('/landing')
      } else {
        // Fetch profile if authenticated
        fetchStudentProfile()
      }
    } else {
      // Keep loading state true while auth is being checked
      setLoading(true);
    }
  }, [user, authLoading, router])

  /**
   * Loading and Authentication State Handling
   * 
   * These conditional returns handle the loading and authentication states:
   * 1. Show a loading spinner while authentication or profile data is loading
   * 2. Return null if no user is authenticated (will redirect to login)
   * 
   * The loading spinner uses the same styling as the global loading component
   * to provide a consistent loading experience throughout the application.
   * It inherits the theme-appropriate background color from the root element.
   */
  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0">
        <LoadingSpinner size="xlarge" /> 
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login in the useEffect
  }

  /**
   * Helper Functions for Personalized Content
   * 
   * These functions extract and format data for personalized UI elements:
   */
  
  /**
   * Get First Name
   * 
   * Extracts the first name from the student profile for personalized greeting.
   * Falls back to email username or 'Student' if no name is available.
   * 
   * @returns The student's first name or a fallback value
   */
  const getFirstName = () => {
    if (studentProfile?.full_name) {
      return studentProfile.full_name.split(' ')[0];
    }
    return user.email ? user.email.split('@')[0] : 'Student';
  }

  /**
   * Get Time-Based Greeting
   * 
   * Returns an appropriate greeting based on the time of day:
   * - Morning: before noon
   * - Afternoon: noon to 6pm
   * - Evening: after 6pm
   * 
   * @returns A time-appropriate greeting string
   */
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }

  /**
   * Shortcuts Configuration
   * 
   * Defines the quick access shortcuts displayed on the dashboard.
   * Each shortcut includes:
   * - title: Display name for the shortcut
   * - description: Brief explanation of the shortcut's purpose
   * - icon: Heroicon component to visually represent the shortcut
   * - path: URL to navigate to when clicked
   * - external: Boolean flag for external links (opens in new tab)
   * 
   * These shortcuts provide quick access to frequently used resources,
   * both internal application pages and external university systems.
   */
  const shortcuts = [
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

  /**
   * Render Skeleton Shortcuts
   * 
   * Creates placeholder skeleton UI elements while shortcuts are loading.
   * This provides a smoother loading experience by showing the layout
   * structure before the actual content is ready to display.
   * 
   * The skeleton UI uses CSS animations defined in home.css to show
   * a subtle loading effect that works with both light and dark themes.
   * 
   * @returns An array of skeleton UI elements for the shortcuts section
   */
  const renderSkeletonShortcuts = () => {
    return Array(4).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="shortcut-skeleton">
        <div className="skeleton-icon"></div>
        <div className="skeleton-title"></div>
        <div className="skeleton-description"></div>
      </div>
    ));
  };

  /**
   * Render the home page dashboard
   * 
   * The dashboard is structured with several key sections:
   * 1. Navigation bar at the top
   * 2. Welcome section with personalized greeting
   * 3. Shortcuts section for quick access to resources
   * 4. Content section with various informational widgets
   * 5. Footer at the bottom
   * 
   * The component uses CSS classes that adapt to the current theme through
   * the theme system, ensuring consistent styling in both light and dark modes.
   */
  return (
    <div className="home-container">
      {/* Navigation bar */}
      <Navbar />
      <main className="main-content">
        {/* Welcome section with personalized greeting */}
        <div className="welcome-section">
          <div className="welcome-container">
            <div className="greeting-content">
              {/* Time-based icon (sun for morning/afternoon, moon for evening) */}
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
              {/* Personalized greeting with time-based message and user's name */}
              <div className="greeting-text">
                <h2 className="welcome-text">
                  {getTimeBasedGreeting()}, <span className="user-name">{getFirstName()}</span>
                </h2>
                {/* Current date display */}
                <p className="welcome-subtext">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            {/* Notifications section */}
            <div className="welcome-actions">
              <div className="notification-container">
                <NotificationsBox />
              </div>
            </div>
          </div>
        </div>
        
        {/* Shortcuts section for quick access to resources */}
        <div className="shortcuts-section" style={{ zIndex: 10, position: 'relative' }}>
          <div className="shortcuts-grid">
            {/* Show skeleton loading UI until shortcuts are ready to display */}
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
        
        {/* Main content section with informational widgets */}
        <div className="content-section">
          {/* First row of widgets */}
          <div className="row">
            <div className="col">
              <CourseWidget />
            </div>
            <div className="col">
              <AIAssistantWidget />
            </div>
          </div>
          {/* Second row of widgets */}
          <div className="row mt-6">
            <div className="col">
              <SalaryCounterWidget />
            </div>
            <div className="col">
              <StudentCountWidget />
            </div>
          </div>
          {/* Third row with RSS feed */}
          <div className="row mt-6">
            <div className="col">
              <RssSimple 
                url="https://rss.app/feeds/vbp2nHhkjpUT6erj.xml" 
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
      {/* Footer component */}
      <Footer />
    </div>
  );
}
