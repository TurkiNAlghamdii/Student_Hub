import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET all courses
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .order('course_code', { ascending: true })
    
    if (error) throw error

    return NextResponse.json({ courses: data })
  } catch (err) {
    console.error('Error fetching courses:', err)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST to create a new course
export async function POST(request: Request) {
  try {
    const courseData = await request.json()
    console.log('Received course data for creation:', courseData)
    
    // Validate required fields
    const requiredFields = ['course_code', 'course_name', 'section']
    for (const field of requiredFields) {
      if (!courseData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if course already exists
    const { data: existingCourse } = await supabaseAdmin
      .from('courses')
      .select('course_code')
      .eq('course_code', courseData.course_code)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists' },
        { status: 409 }
      )
    }

    // Add default faculity_id since it's required by the database
    const dataToInsert = {
      ...courseData,
      faculity_id: 1 // Default faculty ID (update this to a valid ID in your database)
    }
    
    console.log('Inserting course with data:', dataToInsert)

    // Insert the new course
    const { data, error } = await supabaseAdmin
      .from('courses')
      .insert([dataToInsert])
      .select()
      .single()

    if (error) {
      console.error('Error creating course:', error)
      throw error
    }

    return NextResponse.json({ 
      message: 'Course created successfully',
      course: data
    })
  } catch (err) {
    console.error('Error creating course:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create course' },
      { status: 500 }
    )
  }
} 