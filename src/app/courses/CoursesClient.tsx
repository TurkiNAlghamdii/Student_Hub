'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import './courses.css'
import { AcademicCapIcon } from '@heroicons/react/24/outline'

// Define the course interface
interface Course {
  course_code: string
  course_name: string
  course_description: string
  faculty?: {
    name: string
  }
  instructor?: string
}

interface CoursesClientProps {
  courses: Course[]
  error: string | null
}

export default function CoursesClient({ courses, error }: CoursesClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [viewMode, setViewMode] = useState<'all' | 'my'>('my')
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])
  
  // Fetch user's courses when component mounts
  useEffect(() => {
    // Skip fetching if auth is still loading or if user is not logged in
    if (authLoading || !user) return;
    
    const fetchUserCourses = async () => {
      setCoursesLoading(true)
      try {
        const response = await fetch('/api/user/courses', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error fetching courses:', errorData)
          
          if (response.status === 401) {
            setFetchError('You need to be logged in to view your courses')
          } else {
            setFetchError(errorData.error || 'Failed to fetch your courses')
          }
          setCoursesLoading(false)
          setInitialLoadComplete(true)
          return
        }
        
        const data = await response.json()

        if (data.courses) {
          setMyCourses(data.courses)
        } else {
          setMyCourses([])
        }
      } catch (error) {
        console.error('An error occurred while fetching your courses:', error)
        setFetchError('An error occurred while fetching your courses')
      } finally {
        setCoursesLoading(false)
        setInitialLoadComplete(true)
      }
    }

    fetchUserCourses()
  }, [user, authLoading])

  // Handle removing a course from user's selection
  const handleRemoveCourse = async (courseCode: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent navigating to course page when removing
    
    if (!user) return

    try {
      setCoursesLoading(true)
      const response = await fetch(`/api/user/courses?courseCode=${courseCode}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      })
      
      if (response.ok) {
        // Remove course from state
        setMyCourses(prevCourses => prevCourses.filter(
          course => course.course_code !== courseCode
        ))
      } else {
        const errorData = await response.json()
        console.error('Failed to remove course:', errorData)
      }
    } catch (error) {
      console.error('Failed to remove course:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  if (error) {
    return (
      <div className="courses-container">
        <Navbar />
        <main className="courses-content">
          <div className="courses-section">
            <h1 className="courses-title">Error</h1>
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  const displayCourses = viewMode === 'all' ? courses : myCourses
  
  // Show loading when authentication is loading, waiting for user data
  const isLoading = authLoading || (viewMode === 'my' && coursesLoading);

  if (isLoading) {
    return (
      <div className="courses-container">
        <Navbar />
        <main className="courses-content">
          <div className="courses-section loading-section">
            <div className="loading-animation">
              <LoadingSpinner />
              <h2 className="loading-text">Loading your courses...</h2>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Don't render the main content if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="courses-container">
      <Navbar />
      <main className="courses-content">
        <div className="courses-section">
          <div className="courses-header">
            <h1 className="courses-title">{viewMode === 'all' ? 'All Courses' : 'My Courses'}</h1>
            
            <div className="view-toggle">
              <button 
                className={`toggle-button ${viewMode === 'my' ? 'active' : ''}`}
                onClick={() => setViewMode('my')}
                disabled={coursesLoading}
              >
                My Courses
              </button>
              <button 
                className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
                disabled={coursesLoading}
              >
                All Courses
              </button>
            </div>
          </div>

          {/* Show a compact loading indicator when toggling between views */}
          {coursesLoading && initialLoadComplete && (
            <div className="inline-loading">
              <LoadingSpinner />
              <span>Updating...</span>
            </div>
          )}

          {fetchError && viewMode === 'my' && !coursesLoading && (
            <p className="error-message">{fetchError}</p>
          )}

          {viewMode === 'my' && !user && !coursesLoading && (
            <div className="login-prompt">
              <p>Please log in to view your courses</p>
              <button 
                className="login-button"
                onClick={() => router.push('/login')}
              >
                Log In
              </button>
            </div>
          )}

          {viewMode === 'my' && user && myCourses.length === 0 && !coursesLoading && !fetchError && (
            <div className="empty-courses-container">
              <p className="empty-courses">You haven&apos;t added any courses yet.</p>
              <button 
                className="browse-button"
                onClick={() => setViewMode('all')}
              >
                Browse All Courses
              </button>
            </div>
          )}

          {!coursesLoading && displayCourses.length > 0 && (
            <div className="courses-grid">
              {displayCourses.map((course) => (
                <div 
                  key={course.course_code}
                  className="course-card"
                  onClick={() => router.push(`/courses/${course.course_code}`)}
                >
                  <h2 className="course-card-code">{course.course_code}</h2>
                  <p className="course-card-name">{course.course_name}</p>
                  <p className="course-card-faculty">
                    <AcademicCapIcon className="h-3 w-3 mr-1" />
                    {course.faculty?.name || 'Faculty of Computing'}
                  </p>
                  
                  {viewMode === 'my' && (
                    <button 
                      className="remove-course-button"
                      onClick={(e) => handleRemoveCourse(course.course_code, e)}
                      aria-label={`Remove ${course.course_code} from your courses`}
                      disabled={coursesLoading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 