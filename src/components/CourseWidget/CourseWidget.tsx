'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import './courseWidget.css'
import { BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface Course {
  course_code: string
  course_name: string
  course_description: string
  faculty?: {
    name: string
  }
  instructor?: string
}

export default function CourseWidget() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animationReady, setAnimationReady] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchUserCourses = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/user/courses', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error fetching courses:', errorData)
          setError(errorData.error || 'Failed to fetch your courses')
          setLoading(false)
          return
        }
        
        const data = await response.json()

        if (data.courses) {
          setCourses(data.courses)
        } else {
          setCourses([])
        }
      } catch (error) {
        console.error('An error occurred while fetching your courses:', error)
        setError('An error occurred while fetching your courses')
      } finally {
        setLoading(false)
        // Start animation after content is loaded
        setTimeout(() => setAnimationReady(true), 100)
      }
    }

    fetchUserCourses()
  }, [user])

  // Rendering skeleton placeholders when not ready
  const renderSkeletonCourses = () => {
    return Array(5).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="course-widget-skeleton">
        <div className="skeleton-code"></div>
        <div className="skeleton-name"></div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="course-widget">
        <div className="course-widget-header">
          <div className="course-widget-title-container">
            <BookOpenIcon className="course-widget-icon" />
            <h3>My Courses</h3>
          </div>
          <Link href="/courses" className="view-all-link">View All</Link>
        </div>
        <div className="course-widget-list">
          {renderSkeletonCourses()}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="course-widget">
        <div className="course-widget-header">
          <div className="course-widget-title-container">
            <BookOpenIcon className="course-widget-icon" />
            <h3>My Courses</h3>
          </div>
          <Link href="/courses" className="view-all-link">View All</Link>
        </div>
        <div className="course-widget-error">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="course-widget">
        <div className="course-widget-header">
          <div className="course-widget-title-container">
            <BookOpenIcon className="course-widget-icon" />
            <h3>My Courses</h3>
          </div>
          <Link href="/courses" className="view-all-link">View All</Link>
        </div>
        <div className="course-widget-empty">
          <BookOpenIcon className="empty-icon" />
          <p>You are not enrolled in any courses yet</p>
          <Link href="/courses" className="browse-courses-btn">
            Browse Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="course-widget">
      <div className="course-widget-header">
        <div className="course-widget-title-container">
          <BookOpenIcon className="course-widget-icon" />
          <h3>My Courses</h3>
        </div>
        <Link href="/courses" className="view-all-link">View All</Link>
      </div>
      <div className="course-widget-list">
        {courses.map((course, index) => (
          <Link 
            href={`/courses/${course.course_code}`} 
            key={course.course_code} 
            className={`course-widget-item ${animationReady ? 'animate' : ''}`}
            style={{ animationDelay: `${0.05 * (index + 1)}s` }}
          >
            <div className="course-widget-item-content">
              <div className="course-widget-item-code">{course.course_code}</div>
              <div className="course-widget-item-name">{course.course_name}</div>
            </div>
            <ArrowRightIcon className="course-widget-item-arrow" />
          </Link>
        ))}
      </div>
    </div>
  )
} 