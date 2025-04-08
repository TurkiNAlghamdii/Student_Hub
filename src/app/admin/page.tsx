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
import { 
  UserGroupIcon, 
  AcademicCapIcon,
  ArrowLeftIcon,
  ShieldExclamationIcon,
  DocumentIcon,
  QuestionMarkCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'courses' | 'contentMod' | 'fileManagement' | 'supportRequests' | 'academicCalendar'>('dashboard')

  // Check if user is admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }

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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen admin-container">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="welcome-section bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 relative overflow-hidden">
            <div className="welcome-container flex items-center justify-between relative z-1">
              <div className="greeting-content flex items-center gap-4">
                <div className="greeting-icon bg-emerald-500/10 rounded-full p-3 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-gray-400 text-sm mt-1">Manage your application settings and data</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                <span className="text-sm text-emerald-400">Admin Access</span>
              </div>
            </div>
          </div>
          
          {activeSection === 'dashboard' ? (
            <div className="shortcuts-section">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  onClick={() => setActiveSection('users')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <UserGroupIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
                    <p className="text-gray-400 text-sm">
                      Manage users, update roles, and control access permissions
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('courses')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <AcademicCapIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Course Management</h3>
                    <p className="text-gray-400 text-sm">
                      Create, edit, and delete courses in the system
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('contentMod')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <ShieldExclamationIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Content Moderation</h3>
                    <p className="text-gray-400 text-sm">
                      Review comments, manage reported content, and remove inappropriate materials
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('fileManagement')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <DocumentIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">File Management</h3>
                    <p className="text-gray-400 text-sm">
                      View uploaded files, monitor storage usage, and remove inappropriate content
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('supportRequests')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <QuestionMarkCircleIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Support Requests</h3>
                    <p className="text-gray-400 text-sm">
                      Manage user support tickets, track issues, and respond to feedback
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSection('academicCalendar')}
                  className="admin-card"
                >
                  <div className="p-6 flex flex-col items-center text-center h-full">
                    <div className="admin-card-icon bg-emerald-500/10 rounded-full p-4">
                      <CalendarIcon className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Academic Calendar</h3>
                    <p className="text-gray-400 text-sm">
                      Manage the academic calendar PDF files for student reference
                    </p>
                  </div>
                </div>

                {/* Add more admin function cards here in the future */}
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setActiveSection('dashboard')}
                className="back-button flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors bg-gray-900/30 rounded-lg px-4 py-2 border border-gray-800/30 hover:border-emerald-500/20 mb-6"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Dashboard
              </button>

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