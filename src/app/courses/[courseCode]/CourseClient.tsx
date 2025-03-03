'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
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

  if (!course && !error) {
    return (
      <div className="loading-container">
        <Navbar title="Loading Course..." />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <LoadingSpinner />
        </div>
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
            <button
              onClick={() => router.push('/courses')}
              className="back-button"
            >
              Back to Courses
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="course-container">
      <Navbar title={`${course!.course_code}: ${course!.course_name}`} />
      <main className="course-content">
        <div className="course-section">
          <div className="course-header">
            <h1 className="course-code">{course!.course_code}</h1>
            <h2 className="course-name">{course!.course_name}</h2>
            <div className="faculty-badge">
              {course!.faculty.name}
            </div>
          </div>
          
          <div className="course-content-section">
            <h3 className="section-title">Course Description</h3>
            <p className="course-description">{course!.course_description}</p>
          </div>
        </div>
      </main>
    </div>
  )
} 