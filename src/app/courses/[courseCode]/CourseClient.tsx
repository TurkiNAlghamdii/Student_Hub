'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import FileUploadSection from '@/components/FileUpload/FileUploadSection'
import FilesList from '@/components/FileUpload/FilesList'
import CommentSection from '@/components/Comments/CommentSection'
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline'
import './course.css'
import ReactMarkdown from 'react-markdown'

interface CourseDetails {
  course_code: string
  course_name: string
  course_description: string
  Instractions: string | null
  faculty: {
    name: string
  }
}

interface CourseClientProps {
  course: CourseDetails | null
  error: string | null
}

export default function CourseClient({ course, error }: CourseClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false)
  const [addStatus, setAddStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [refreshFilesList, setRefreshFilesList] = useState(0)
  const [showUploadSection, setShowUploadSection] = useState(false)

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Check if course is already added
  useEffect(() => {
    const checkIfCourseIsAdded = async () => {
      if (authLoading || !user || !course) {
        setCheckingStatus(false)
        return
      }

      try {
        const response = await fetch('/api/user/courses', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (data.courses && Array.isArray(data.courses)) {
            const isAdded = data.courses.some(
              (c: { course_code: string }) => c.course_code === course.course_code
            )
            setIsAlreadyAdded(isAdded)
          }
        }
      } catch (error) {
        console.error('Error checking if course is added:', error)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkIfCourseIsAdded()
  }, [user, course, authLoading])

  // Handle adding a course to user's selection
  const handleAddCourse = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isAlreadyAdded) {
      setAddStatus({
        message: 'This course is already in your courses.',
        isError: true,
      })
      return
    }

    setIsAdding(true)
    setAddStatus(null)

    try {
      const response = await fetch('/api/user/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({ courseCode: course!.course_code }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsAlreadyAdded(true)
        setAddStatus({
          message: 'Course added to your courses!',
          isError: false,
        })
      } else {
        setAddStatus({
          message: data.error || 'Failed to add course',
          isError: true,
        })
      }
    } catch (error) {
      console.error('Error adding course:', error)
      setAddStatus({
        message: 'An error occurred',
        isError: true,
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleFileUploadSuccess = () => {
    setShowUploadSection(false)
    setRefreshFilesList(prev => prev + 1)
  }

  const toggleUploadSection = () => {
    setShowUploadSection(prev => !prev)
  }

  // Function to navigate to chat with course description
  const handleNavigateToChat = () => {
    if (course) {
      // Save course description and name to session storage
      sessionStorage.setItem('courseDescription', course.course_description);
      sessionStorage.setItem('courseName', course.course_name);
      // Navigate to the chat page
      router.push(`/courses/${course.course_code}/chat`);
    }
  }

  if (authLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    )
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  if (!course && !error) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="course-container">
        <Navbar />
        <main className="course-content">
          <div className="course-section">
            <h1 className="text-2xl font-bold mb-6 text-white">Error</h1>
            <p className="error-message">{error}</p>
            <div className="course-actions">
              <button
                onClick={() => router.push('/courses')}
                className="back-button"
                aria-label="Back to Courses"
                type="button"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                <span>Back to Courses</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="course-container">
      <Navbar />
      <main className="course-content">
        <div className="course-section">
          <div className="course-header">
            <div className="course-header-container">
              {/* Left column: Course information */}
              <div className="course-info-column">
                <div className="course-code-container">
                  <span className="course-code">{course!.course_code}</span>
                  {isAlreadyAdded && (
                    <span className="enrollment-badge">
                      <CheckIcon className="h-3.5 w-3.5 mr-1" />
                      Enrolled
                    </span>
                  )}
                </div>
                <h1 className="course-name">{course!.course_name}</h1>
                
                <div className="course-metadata">
                  <div className="metadata-item">
                    <AcademicCapIcon className="metadata-icon" />
                    <span>{course!.faculty.name}</span>
                  </div>
                </div>
              </div>
              
              {/* Right column: Actions */}
              <div className="course-actions-column">
                <div className="actions-container">
                  {/* Primary action - Add/Remove course */}
                  {!isAlreadyAdded ? (
                    <button
                      onClick={handleAddCourse}
                      className="primary-action-button"
                      disabled={isAdding || checkingStatus}
                      aria-label="Add to my courses"
                      type="button"
                    >
                      {isAdding ? (
                        <>
                          <div className="button-spinner"></div>
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="h-5 w-5 mr-2" />
                          <span>Add to My Courses</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="enrolled-button"
                      disabled
                      aria-label="Course added"
                      type="button"
                    >
                      <CheckIcon className="h-5 w-5 mr-2" />
                      <span>Added to My Courses</span>
                    </button>
                  )}
                  
                  {/* Secondary actions */}
                  <div className="secondary-actions">
                    <button
                      onClick={handleNavigateToChat}
                      className="chat-button"
                      aria-label="AI Chat Assistant"
                      type="button"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1.5" />
                      <span>AI Chat Assistant</span>
                    </button>
                    
                    <button
                      onClick={() => router.push('/courses')}
                      className="back-button"
                      aria-label="Back to Courses"
                      type="button"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                      <span>Back to Courses</span>
                    </button>
                  </div>
                </div>
                
                {/* Quick navigation links */}
                <div className="quick-nav-container">
                  <button 
                    onClick={() => document.querySelector('.course-content-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="quick-nav-button"
                    aria-label="Go to Description"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5H16M8 9H16M8 13H12M6 17H14M17 17L21 21M21 17L17 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Description</span>
                  </button>
                  
                  {/* Add Instructions Quick Nav Button */}
                  {course!.Instractions && (
                    <button 
                      onClick={() => document.querySelector('.instructions-section-container')?.scrollIntoView({ behavior: 'smooth' })}
                      className="quick-nav-button"
                      aria-label="Go to Instructions"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>Instructions</span>
                    </button>
                  )}
                  
                  <button 
                    onClick={() => document.querySelector('.files-section-container')?.scrollIntoView({ behavior: 'smooth' })}
                    className="quick-nav-button"
                    aria-label="Go to Files"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 8.5V18C20 20.2091 18.2091 22 16 22H8C5.79086 22 4 20.2091 4 18V6C4 3.79086 5.79086 2 8 2H13.5L20 8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V7C14 7.55228 14.4477 8 15 8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Files</span>
                  </button>
                  <button 
                    onClick={() => document.querySelector('.comments-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="quick-nav-button"
                    aria-label="Go to Discussion"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11499 17.053 3.99476 18.5291 5.47086C20.0052 6.94695 20.885 8.91565 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Discussion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {addStatus && (
            <div className="status-message-container">
              <p className={`status-message ${addStatus.isError ? 'error' : 'success'}`}>
                {addStatus.message}
              </p>
            </div>
          )}
          
          <div className="course-content-section">
            <div className="section-header">
              <h3 className="section-title">Course Description</h3>
            </div>
            
            <div className="description-container">
              <div className="description-content">
                <h2 className="text-xl font-semibold mb-2 text-emerald-400">Description</h2>
                <p className="text-gray-300 mb-6">{course!.course_description}</p>
              </div>
            </div>
          </div>
          
          {/* Instructions Section - Only show if instructions exist */}
          {course!.Instractions && (
            <div className="instructions-section-container">
              <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3 className="section-title">Course Instructions</h3>
              </div>
              
              <div className="instructions-container">
                <div className="instructions-content">
                  <div className="prose prose-invert max-w-none text-gray-300">
                    <ReactMarkdown>{course!.Instractions}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="files-section-container">
            <div className="section-header" style={{ marginTop: '2rem' }}>
              {/* Removed the title here as it's duplicated in the FilesList component */}
            </div>
            
            <div className="files-section-content">
              <div className="files-list-wrapper">
                <FilesList 
                  courseCode={course!.course_code} 
                  refreshTrigger={refreshFilesList} 
                />
              </div>
              
              <div className="files-actions">
                <button
                  onClick={toggleUploadSection}
                  className={`files-action-button ${showUploadSection ? 'cancel' : 'upload'}`}
                  aria-label={showUploadSection ? "Cancel upload" : "Upload a file"}
                  type="button"
                >
                  {showUploadSection ? (
                    <>
                      <XMarkIcon className="button-icon" />
                      <span>Cancel Upload</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="button-icon" />
                      <span>Upload Course Material</span>
                    </>
                  )}
                </button>
              </div>
              
              {showUploadSection && (
                <div className="upload-section-wrapper">
                  <FileUploadSection 
                    courseCode={course!.course_code} 
                    onUploadSuccess={handleFileUploadSuccess} 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="discussion-section-container">
            <CommentSection courseCode={course!.course_code} />
          </div>
        </div>
      </main>
    </div>
  )
}