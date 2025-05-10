/**
 * Students Directory Page Component
 * 
 * This client-side component provides a searchable directory of students in the system.
 * It allows users to browse, search, and view basic information about other students,
 * with options to view detailed profiles or copy email addresses for contact.
 * 
 * Key features:
 * - Authentication-protected access
 * - Real-time search functionality
 * - Student profile cards with animations
 * - Email copy functionality with visual feedback
 * - Links to individual student profiles
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes via the root element class, ensuring
 * consistent styling across the application.
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import Image from 'next/image'
import Link from 'next/link'
import '../profile/profile.css'

/**
 * Animation Styles
 * 
 * Custom CSS animations for enhancing the user experience in the student directory.
 * These animations are applied to various elements to create a more engaging and
 * interactive interface. The animations include effects for hovering over student
 * cards, clicking on icons, and visual feedback for interactions.
 * 
 * These styles are injected directly into the component rather than in a separate
 * CSS file to keep all the animation-related code together and make it easier to
 * maintain and modify.
 */
const animationStyles = `
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes wave {
  0% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  100% {
    transform: translateX(-5px);
  }
}

@keyframes shine {
  0% {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.7);
  }
  100% {
    box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
  }
}

@keyframes gradientBorder {
  0% {
    border-color: rgba(16, 185, 129, 0.4);
  }
  50% {
    border-color: rgba(16, 185, 129, 0.8);
  }
  100% {
    border-color: rgba(16, 185, 129, 0.4);
  }
}

.search-icon-animated {
  animation: pulse 2s infinite ease-in-out;
}

.avatar-animated {
  transition: all 0.5s ease;
}

.avatar-animated:hover {
  animation: float 2s infinite ease-in-out;
  transform: scale(1.1);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
}

.copy-icon-animated {
  transition: all 0.2s;
}

.copy-icon-animated:hover {
  animation: bounce 1s infinite ease-in-out;
  filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.7));
}

.profile-icon-animated {
  transition: all 0.3s;
}

.profile-icon-animated:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 5px rgba(16, 185, 129, 0.7));
}

.student-card-animated {
  transition: all 0.4s ease;
  animation: shine 5s infinite ease-in-out;
}

.student-card-animated:hover {
  transform: translateY(-8px) scale(1.02);
  animation: none;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.title-animated {
  position: relative;
  display: inline-block;
}

.title-animated::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -5px;
  left: 0;
  background-color: #10b981;
  transition: all 0.5s ease;
}

.title-animated:hover::after {
  width: 100%;
}

.confetti {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: #10b981;
  opacity: 0;
  animation: confetti-fall 2s forwards;
  z-index: 10;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(20px) rotate(90deg);
    opacity: 0;
  }
}
`;

/**
 * Student Interface
 * 
 * Defines the structure of a student object in the directory.
 * This interface is used for type checking and ensuring data consistency
 * when working with student information from the database.
 * 
 * @property id - Unique identifier for the student (UUID from Supabase Auth)
 * @property full_name - Student's full name
 * @property student_id - Student's university ID number
 * @property faculty - Student's faculty/department
 * @property avatar_url - Optional URL to the student's profile picture
 * @property email - Optional student's email address
 */
interface Student {
  id: string
  full_name: string
  student_id: string | number
  faculty: string
  avatar_url?: string
  email?: string
}

/**
 * SupabaseError Interface
 * 
 * Defines the structure of error objects returned by Supabase.
 * Used for type checking when handling database errors.
 * 
 * @property message - The error message
 */
interface SupabaseError {
  message: string;
}

/**
 * Student Directory Component
 * 
 * Main component for displaying and searching through the student directory.
 * It fetches student data from Supabase and provides search functionality.
 * 
 * @returns The rendered student directory with search and student cards
 */
export default function StudentDirectory() {
  // Navigation and authentication
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()  // Current user and auth loading state
  
  // State management
  const [students, setStudents] = useState<Student[]>([])  // List of all students
  const [loading, setLoading] = useState(true)            // Data loading state
  const [error, setError] = useState<string | null>(null)  // Error state
  const [searchQuery, setSearchQuery] = useState('')       // Current search query
  const [copiedEmails, setCopiedEmails] = useState<{[key: string]: boolean}>({})  // Tracks which emails have been copied
  const [confetti, setConfetti] = useState<boolean>(false)

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, full_name, student_id, faculty, avatar_url, email')
          .order('full_name', { ascending: true })

        if (error) throw error

        setStudents(data || [])
      } catch (error: unknown) {
        console.error('Error loading students:', error)
        const supabaseError = error as SupabaseError
        setError(supabaseError.message || 'Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        fetchStudents()
      }
    }
  }, [user, authLoading, router])

  // Add confetti effect when copying
  const copyEmailToClipboard = (email: string, studentId: string | number) => {
    if (!email) return
    
    navigator.clipboard.writeText(email)
      .then(() => {
        // Set this specific email as copied
        setCopiedEmails(prev => ({
          ...prev,
          [studentId.toString()]: true
        }))
        
        // Trigger confetti
        setConfetti(true)
        setTimeout(() => setConfetti(false), 2000)
        
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopiedEmails(prev => ({
            ...prev,
            [studentId.toString()]: false
          }))
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy email: ', err)
      })
  }

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.faculty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Show centered spinner if auth or data is loading
  if (authLoading || loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm translate-z-0">
        <LoadingSpinner size="xlarge" />
      </div>
    )
  }

  // If auth is done, loading is done, but no user, render nothing (redirect should handle)
  if (!user) return null

  return (
    <div className="profile-container min-h-screen bg-gradient-to-b from-background to-background/70">
      {/* Add animation styles */}
      <style jsx global>{animationStyles}</style>
      
      <Navbar />
      <main className="container mx-auto px-4 pt-28 sm:px-6 sm:pt-32 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="profile-header-card mb-8">
            <h1 className="profile-main-title title-animated">Student profiles</h1>
            <p className="profile-subtitle">Browse and view student profiles</p>
          </div>

          {/* Search bar */}
          <div className="mb-8">
            <div className="relative search-container">
              <input 
                type="text"
                placeholder="Search by name or faculty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 pl-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200"
              />
              <svg 
                className="absolute left-4 top-[42%] text-emerald-500/70 search-icon-animated" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {error && (
            <div className="error-message mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Students grid */}
          {searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  className="student-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 student-card-animated"
                >
                  <div className="p-6 flex flex-col items-center">
                    <div className="mb-4 relative">
                      {student.avatar_url ? (
                        <div className="relative avatar-animated">
                          <Image 
                            src={student.avatar_url} 
                            alt={student.full_name || 'Student'} 
                            width={96} 
                            height={96} 
                            className="rounded-full object-cover h-24 w-24 border-4 border-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-200"
                          />
                          <div className="absolute inset-0 rounded-full bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-full bg-emerald-500 h-24 w-24 flex items-center justify-center text-white text-2xl font-bold border-4 border-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-200 avatar-animated">
                          {student.full_name.charAt(0) || '?'}
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 title-animated">
                      {student.full_name}
                    </h3>
                    <div className="flex flex-col items-center space-y-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center flex items-center hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">
                        <span className="inline-block w-5 h-5 mr-1.5 text-emerald-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 9.3V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.3" />
                            <path d="m12 13 8-4.2-8-4.2-8 4.2Z" />
                            <path d="M18 10.2V14l-6 3.3-6-3.3v-3.8" />
                          </svg>
                        </span>
                        <span className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors duration-200">{student.faculty}</span>
                      </p>
                    </div>
                    <div className="flex space-x-3 mt-6">
                      <Link
                        href={`/profile?studentId=${student.id}`} 
                        className="px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-md transition-colors duration-200 transform hover:scale-105 flex items-center profile-icon-animated relative overflow-hidden group"
                      >
                        <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span className="relative z-10">View Profile</span>
                        <span className="absolute inset-0 bg-emerald-600 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md transform scale-x-0 group-hover:scale-x-100 origin-left"></span>
                      </Link>
                      
                      <div className="flex space-x-2 relative">
                        {/* Confetti effect */}
                        {confetti && copiedEmails[student.id] && (
                          <>
                            <div className="confetti" style={{ left: '30%', top: '-20px', animationDelay: '0s' }}></div>
                            <div className="confetti" style={{ left: '40%', top: '-15px', animationDelay: '0.2s' }}></div>
                            <div className="confetti" style={{ left: '60%', top: '-25px', animationDelay: '0.4s' }}></div>
                            <div className="confetti" style={{ left: '70%', top: '-10px', animationDelay: '0.1s' }}></div>
                            <div className="confetti" style={{ left: '50%', top: '-20px', animationDelay: '0.3s' }}></div>
                          </>
                        )}
                        
                        {/* Copy email button */}
                        {student.email && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              copyEmailToClipboard(student.email || '', student.id)
                            }}
                            className="px-4 py-2 text-sm border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-md transition-colors duration-200 flex items-center copy-icon-animated relative overflow-hidden group"
                            title="Copy email address to clipboard"
                          >
                            {copiedEmails[student.id] ? (
                              <>
                                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20 6L9 17l-5-5"></path>
                                </svg>
                                <span className="relative z-10">Copied!</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span className="relative z-10">Copy Email</span>
                              </>
                            )}
                            <span className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-md transform scale-x-0 group-hover:scale-x-100 origin-left"></span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredStudents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 p-8">
              <svg
                className="w-16 h-16 text-emerald-500/50 mb-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
                ></path>
              </svg>
              <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">
                {searchQuery ? 'No students match your search criteria' : 'No students found'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                {searchQuery 
                  ? 'Try using different keywords or check your spelling' 
                  : 'There are no students registered in the system yet'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 