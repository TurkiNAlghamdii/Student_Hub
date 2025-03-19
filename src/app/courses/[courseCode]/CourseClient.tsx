'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
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
  const { user } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [isAlreadyAdded, setIsAlreadyAdded] = useState(false)
  const [addStatus, setAddStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(true)

  // Check if course is already added
  useEffect(() => {
    const checkIfCourseIsAdded = async () => {
      if (!user || !course) {
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
  }, [user, course])

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
                <span>Back to Courses</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

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

  return (
    <div className="course-container">
      <Navbar title={`${course!.course_code}: ${course!.course_name}`} />
      <main className="course-content">
        <div className="course-section">
          <div className="course-actions">
            <button
              onClick={() => router.push('/courses')}
              className="back-button"
              aria-label="Back to Courses"
              type="button"
            >
              <span>Back to Courses</span>
            </button>
            
            <button 
              onClick={handleAddCourse}
              className={`add-course-button ${isAdding ? 'loading' : ''} ${isAlreadyAdded ? 'already-added' : ''}`}
              disabled={isAdding || checkingStatus || isAlreadyAdded}
              aria-label={isAlreadyAdded ? 'Already added to courses' : 'Add to My Courses'}
              type="button"
            >
              {isAdding ? '\u00A0' : isAlreadyAdded ? 'Added to Courses' : 'Add to My Courses'}
            </button>
          </div>
        
          <div className="course-header">
            <h1 className="course-code">{course!.course_code}</h1>
            <h2 className="course-name">{course!.course_name}</h2>
            <div className="faculty-badge">
              {course!.faculty.name}
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
        </div>
      </main>
    </div>
  )
} 