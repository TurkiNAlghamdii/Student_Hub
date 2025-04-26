/**
 * Course Widget Component
 * 
 * This client-side component displays a personalized list of courses for the logged-in user.
 * It provides quick access to enrolled courses with a visually appealing card-based interface.
 * 
 * Key features:
 * - Personalized course listing based on user enrollment
 * - Animated card appearance for enhanced UX
 * - Local caching to improve performance and reduce API calls
 * - Responsive design for various screen sizes
 * - Empty and error states with appropriate messaging
 * 
 * The component integrates with the application's theme system through CSS classes
 * that adapt to both light and dark modes. It uses the root element's theme class
 * (light/dark) to style elements appropriately, preventing theme flashing during
 * navigation by relying on theme classes rather than hardcoded color values.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import './courseWidget.css'
import { BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

/**
 * Course Interface
 * 
 * Defines the structure of a course object retrieved from the database.
 * This interface ensures type safety when working with course data.
 * 
 * @property course_code - Unique identifier for the course (e.g., 'CS101')
 * @property course_name - Full name of the course
 * @property course_description - Description of the course content
 * @property faculty - Optional object containing faculty information
 * @property instructor - Optional name of the course instructor
 */
interface Course {
  course_code: string
  course_name: string
  course_description: string
  faculty?: {
    name: string
  }
  instructor?: string
}

/**
 * Cache Expiration Constant
 * 
 * Defines how long the cached course data remains valid (10 minutes).
 * This helps reduce API calls while ensuring data doesn't become too stale.
 */
const CACHE_EXPIRATION = 10 * 60 * 1000;

/**
 * Course Widget Component
 * 
 * Displays a personalized list of courses for the logged-in user.
 * This component handles fetching, caching, and displaying course data,
 * with appropriate loading, empty, and error states.
 * 
 * The component uses CSS classes that adapt to the application's theme system,
 * supporting both light and dark modes through the root element's theme class.
 * This ensures consistent visual appearance across theme changes and prevents
 * theme flashing during navigation.
 * 
 * @returns React component for displaying user's enrolled courses
 */
export default function CourseWidget() {
  // Get current user from authentication context
  const { user } = useAuth()
  
  // State for courses and UI management
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animationReady, setAnimationReady] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchUserCourses = async () => {
      // Try to get data from cache first
      const cachedData = localStorage.getItem('userCourses');
      const cachedTimestamp = localStorage.getItem('userCoursesTimestamp');
      
      // Check if we have valid cached data
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const now = Date.now();
        
        // If cache is still valid (less than 10 minutes old)
        if (now - timestamp < CACHE_EXPIRATION) {
          try {
            const parsedData = JSON.parse(cachedData);
            setCourses(parsedData);
            setLoading(false);
            // Make animation ready immediately for cached data
            setAnimationReady(true);
            
            // Still fetch in the background to update cache
            fetchFreshData(false);
            return;
          } catch (err) {
            // If parsing fails, continue to fetch fresh data
            console.error('Error parsing cached course data:', err);
          }
        }
      }
      
      // If no valid cache or parsing failed, fetch fresh data
      fetchFreshData(true);
    }
    
    const fetchFreshData = async (showLoading: boolean) => {
      if (showLoading) {
        setLoading(true);
      }
      
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
          if (showLoading) {
            setLoading(false)
          }
          return
        }
        
        const data = await response.json()

        if (data.courses) {
          // Store in state
          setCourses(data.courses)
          
          // Cache the data
          localStorage.setItem('userCourses', JSON.stringify(data.courses));
          localStorage.setItem('userCoursesTimestamp', Date.now().toString());
        } else {
          setCourses([])
        }
      } catch (error) {
        console.error('An error occurred while fetching your courses:', error)
        setError('An error occurred while fetching your courses')
      } finally {
        if (showLoading) {
          setLoading(false)
        }
        // Start animation immediately after content is loaded
        setAnimationReady(true)
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