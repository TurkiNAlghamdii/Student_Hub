import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET a specific course
export async function GET(
  request: Request,
  { params }: { params: { courseCode: string } }
) {
  try {
    const courseCode = params.courseCode
    
    if (!courseCode) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ course: data })
  } catch (err) {
    console.error('Error fetching course:', err)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT to update a course
export async function PUT(
  request: Request,
  { params }: { params: { courseCode: string } }
) {
  try {
    const courseCode = params.courseCode
    console.log('Updating course with code:', courseCode)
    
    if (!courseCode) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    const courseData = await request.json()
    console.log('Received course data for update:', courseData)
    
    // Validate required fields
    const requiredFields = ['course_name', 'section']
    for (const field of requiredFields) {
      if (!courseData[field]) {
        console.log(`Missing required field for update: ${field}`)
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if course exists
    const { data: existingCourse, error: checkError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .single()

    if (checkError) {
      console.log('Error checking for existing course:', checkError)
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }
      throw checkError
    }

    console.log('Found existing course:', existingCourse)
    
    // Create a sanitized update object
    const updateData = {
      course_name: courseData.course_name,
      course_description: courseData.course_description || null,
      section: courseData.section,
      faculity_id: 1 // Default faculty ID (update this to a valid ID in your database)
    }
    
    console.log('Sending update to Supabase with data:', updateData)
    
    // Update the course with specific fields only
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(updateData)
      .eq('course_code', courseCode)
      .select()

    if (error) {
      console.error('Supabase error during update:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('Course updated successfully:', data)
    return NextResponse.json({
      message: 'Course updated successfully',
      course: data[0] || data
    })
  } catch (err) {
    console.error('Error updating course:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE a course
export async function DELETE(
  request: Request,
  { params }: { params: { courseCode: string } }
) {
  try {
    const courseCode = params.courseCode
    
    if (!courseCode) {
      return NextResponse.json(
        { error: 'Course code is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    // Check if course exists
    const { error: checkError } = await supabaseAdmin
      .from('courses')
      .select('course_code')
      .eq('course_code', courseCode)
      .single()

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }
      throw checkError
    }

    // Delete the course
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('course_code', courseCode)

    if (error) throw error

    return NextResponse.json({
      message: 'Course deleted successfully'
    })
  } catch (err) {
    console.error('Error deleting course:', err)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
} 