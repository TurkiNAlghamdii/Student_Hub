'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import './courses.css'

// Define the course interface
interface Course {
  course_code: string
  course_name: string
  course_description: string
  faculty: {
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

  if (error) {
    return (
      <div className="courses-container">
        <Navbar title="Courses" />
        <main className="courses-content">
          <div className="courses-section">
            <h1 className="courses-title">Error</h1>
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <div className="courses-container">
        <Navbar title="Courses" />
        <main className="courses-content">
          <div className="courses-section">
            <h1 className="courses-title">Courses</h1>
            <p className="empty-courses">No courses found.</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="courses-container">
      <Navbar title="Courses" />
      <main className="courses-content">
        <div className="courses-section">
          <h1 className="courses-title">All Courses</h1>
          <div className="courses-grid">
            {courses.map((course) => (
              <div 
                key={course.course_code}
                className="course-card"
                onClick={() => router.push(`/courses/${course.course_code}`)}
              >
                <h2 className="course-card-code">{course.course_code}</h2>
                <p className="course-card-name">{course.course_name}</p>
                <p className="course-card-faculty">{course.faculty.name}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
} 