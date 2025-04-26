/**
 * Admin Courses API Route
 * 
 * This API provides administrative functionality for managing courses, including:
 * - Retrieving all courses in the system
 * - Creating new courses
 * 
 * These endpoints are intended for admin use only and should be protected
 * by appropriate authorization checks in the frontend.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET endpoint to fetch all courses
 * 
 * Retrieves all courses from the database, ordered by course code.
 * This endpoint is used by the admin dashboard to display and manage courses.
 * 
 * @returns JSON response with an array of course objects
 */
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    /**
     * Fetch all courses from the database
     * Courses are ordered alphabetically by course code for easier navigation
     */
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('course_code', { ascending: true })
    
    if (error) throw error

    // Return the courses data in a structured response
    return NextResponse.json({ courses: data })
  } catch (err) {
    // Handle any errors during the course fetching process
    console.error('Error fetching courses:', err)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to create a new course
 * 
 * Creates a new course in the database with the provided information.
 * Validates required fields and checks for existing courses with the same code.
 * 
 * @param request - The incoming HTTP request with course data
 * @returns JSON response with the created course or error information
 */
export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    // Parse the request body to extract course information
    const courseData = await request.json()
    console.log('Received course data for creation:', courseData)
    
    /**
     * Validate that all required fields are present
     * This ensures data integrity in the courses table
     */
    const requiredFields = ['course_code', 'course_name', 'section']
    for (const field of requiredFields) {
      if (!courseData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    /**
     * Check for duplicate course codes
     * Course codes must be unique in the system to prevent confusion
     * and maintain data integrity
     */
    const { data: existingCourse } = await supabaseAdmin
      .from('courses')
      .select('course_code')
      .eq('course_code', courseData.course_code)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 409 } // Conflict status code
      )
    }

    /**
     * Prepare the course data for insertion
     * This normalizes field names and adds required default values
     * Note: There's a typo in the database schema ('Instractions' instead of 'Instructions')
     * but we maintain it for compatibility
     */
    const dataToInsert = {
      course_code: courseData.course_code,
      course_name: courseData.course_name,
      // Support both field name variations for description
      course_description: courseData.description || courseData.course_description || null,
      Instractions: courseData.Instractions || null,
      section: courseData.section,
      faculity_id: 1 // Default faculty ID (required by database schema)
    }
    
    console.log('Inserting course with data:', dataToInsert)

    /**
     * Insert the new course into the database
     * We use .select() and .single() to return the created course data
     * with any default values or generated IDs from the database
     */
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert([dataToInsert])
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw error
    }

    /**
     * Return success response with the created course data
     * This allows the frontend to immediately display the new course
     * without requiring a separate fetch
     */
    return NextResponse.json({ 
      message: 'Course created successfully',
      course: data
    })
  } catch (err) {
    // Handle any errors during the course creation process
    console.error('Error creating course:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create course' },
      { status: 500 }
    )
  }
}