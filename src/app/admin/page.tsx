/**
 * Admin Dashboard Page
 * 
 * This page provides administrative functionality for managing the Student Hub application.
 * It includes sections for user management, course management, content moderation,
 * file management, support requests, and academic calendar management.
 * 
 * Access is restricted to users with admin privileges only.
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import UserManagement from '@/components/Admin/UserManagement'
import CourseManagement from '@/components/Admin/CourseManagement'
import ContentModeration from '@/components/Admin/ContentModeration'
import FileManagement from '@/components/Admin/FileManagement'
import SupportRequests from '@/components/Admin/SupportRequests'
import AcademicCalendarManagement from '@/components/Admin/AcademicCalendarManagement'
import './admin-styles.css'
import './admin-light-mode.css'
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon,
  DocumentIcon,
  QuestionMarkCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

/**
 * Admin Page Component
 * 
 * Handles admin dashboard rendering and functionality
 */
export default function AdminPage() {
  const router = useRouter()
  // Get user authentication state from context
  const { user, loading: authLoading } = useAuth()
  // Track if current user has admin privileges
  const [isAdmin, setIsAdmin] = useState(false)
  // Track loading state for admin verification
  const [loading, setLoading] = useState(true)
  // Track which admin section is currently active
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'courses' | 'contentMod' | 'fileManagement' | 'supportRequests' | 'academicCalendar'>('dashboard')

  /**
   * Check if user has admin privileges
   * Redirects to login page if not authenticated
   * Redirects to home page if authenticated but not an admin
   */
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }

      // Check various formats of admin flag in user metadata
      const isUserAdmin = user.app_metadata?.is_admin === true || 
                         user.app_metadata?.is_admin === 'true' || 
                         String(user.app_metadata?.is_admin).toLowerCase() === 'true'
      
      setIsAdmin(isUserAdmin)
      setLoading(false)

      if (!isUserAdmin) {
        router.push('/')
      }
    }
  }, [user, authLoading, router])

  /**
   * Loading state - shown while checking authentication and admin status
   */
  if (loading || authLoading) {
    return (
      <div className="min-h-screen admin-container">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  /**
   * If user is not an admin, return null
   * This is a fallback in case the redirect in useEffect hasn't completed yet
   */
  if (!isAdmin) {
    return null
  }

  /**
   * Main admin dashboard render
   */
  return (
    <div className="min-h-screen admin-container">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Admin dashboard header with title and admin badge */}
          <div className="welcome-section bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden">
            <div className="welcome-container flex items-center justify-between relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon bg-emerald-500/10 rounded-full p-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold dark:text-white text-gray-800">Admin Dashboard</h1>
                  <p className="dark:text-gray-400 text-gray-600 text-sm mt-1">Manage your application settings and data</p>
                </div>
              </div>
              <div className="flex items-center gap-2 dark:bg-emerald-500/10 bg-emerald-500/20 px-3 py-1 rounded-lg border dark:border-emerald-500/20 border-emerald-500/30">
                <span className="text-sm dark:text-emerald-400 text-emerald-600">Admin Access</span>
              </div>
            </div>
          </div>
          
          {/* Conditional rendering based on active section */}
          {/* Dashboard view with admin function cards */}
          {activeSection === 'dashboard' ? (
            <div className="shortcuts-section">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Management Card */}
                <div 
                  onClick={() => setActiveSection('users')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <UserGroupIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">User Management</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      Manage users, update roles, and control access permissions
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('courses')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <AcademicCapIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">Course Management</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      Create, edit, and delete courses in the system
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('contentMod')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <ShieldExclamationIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">Content Moderation</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      Review comments, manage reported content, and remove inappropriate materials
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('fileManagement')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <DocumentIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">File Management</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      View uploaded files, monitor storage usage, and remove inappropriate content
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('supportRequests')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <QuestionMarkCircleIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">Support Requests</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      Manage user support tickets, track issues, and respond to feedback
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('academicCalendar')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon dark:bg-emerald-500/10 bg-emerald-500/20 rounded-full p-4">
                      <CalendarIcon className="h-10 w-10 dark:text-emerald-400 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold dark:text-white text-gray-800 mb-2">Academic Calendar</h3>
                    <p className="dark:text-gray-400 text-gray-600 text-sm">
                      Manage the academic calendar PDF files for student reference
                    </p>
                  </div>
                </div>

                {/* Add more admin function cards here in the future */}
              </div>
            </div>
          ) : (
            <>
              {/* Back button to return to main dashboard */}
              <button
                onClick={() => setActiveSection('dashboard')}
                className="back-button flex items-center gap-2 dark:text-gray-400 text-gray-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors dark:bg-gray-900/30 bg-gray-200/50 rounded-lg px-4 py-2 dark:border-gray-800/30 border-gray-300/50 border hover:border-emerald-500/20 mb-6"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Dashboard
              </button>

              {/* Conditional rendering of admin components based on active section */}
              {activeSection === 'users' && <UserManagement />}
              {activeSection === 'courses' && <CourseManagement />}
              {activeSection === 'contentMod' && <ContentModeration />}
              {activeSection === 'fileManagement' && <FileManagement />}
              {activeSection === 'supportRequests' && <SupportRequests />}
              {activeSection === 'academicCalendar' && <AcademicCalendarManagement />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}