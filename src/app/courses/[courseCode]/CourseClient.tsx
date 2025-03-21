'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import FileUploadSection from '@/components/FileUpload/FileUploadSection'
import FilesList from '@/components/FileUpload/FilesList'
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  ArrowUpTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import './course.css'

interface CourseDetails {
  course_code: string
  course_name: string
  course_description: string
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
              (c: any) => c.course_code === course.course_code
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
        <Navbar title="Course Not Found" />
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
      <Navbar title={course!.course_name} />
      <main className="course-content">
        <div className="course-section">
          <div className="course-header">
            <div className="course-info">
              <span className="course-code">{course!.course_code}</span>
              <h1 className="course-name">{course!.course_name}</h1>
              <p className="course-faculty">{course!.faculty.name}</p>
            </div>
            
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
              
              {!isAlreadyAdded ? (
                <button
                  onClick={handleAddCourse}
                  className="add-button"
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
                      <PlusIcon className="h-4 w-4" />
                      <span>Add to My Courses</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  className="added-button"
                  disabled
                  aria-label="Course added"
                  type="button"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Added to My Courses</span>
                </button>
              )}
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
            <h3 className="section-title">Course Description</h3>
            <p className="course-description">{course!.course_description}</p>
          </div>
          
          <div className="files-section-container">
            <FilesList 
              courseCode={course!.course_code} 
              refreshTrigger={refreshFilesList} 
            />
            
            <div className="upload-toggle-container">
              <button
                onClick={toggleUploadSection}
                className="upload-toggle-button"
                aria-label={showUploadSection ? "Hide upload form" : "Upload a file"}
                type="button"
              >
                {showUploadSection ? (
                  <>
                    <XMarkIcon className="h-4 w-4" />
                    <span>Cancel Upload</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-4 w-4" />
                    <span>Upload File</span>
                  </>
                )}
              </button>
            </div>
            
            {showUploadSection && (
              <FileUploadSection 
                courseCode={course!.course_code} 
                onUploadSuccess={handleFileUploadSuccess} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}