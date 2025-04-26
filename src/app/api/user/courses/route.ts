/**
 * User Courses API Route
 * 
 * This API provides endpoints for managing a user's course selections, including:
 * - Getting a list of courses the user is enrolled in
 * - Adding a new course to the user's selection
 * - Removing a course from the user's selection
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Faculty interface to handle different formats of faculty data
 * Some courses may have faculty as a string, others as an object
 */
interface Faculty {
  name?: string;
  [key: string]: unknown;
}

/**
 * Create a Supabase client with admin privileges
 * Uses the service role key to perform admin operations
 * Falls back to anon key if service role key is not available
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Helper function to normalize faculty data into a consistent format
 * Handles different data formats that might be stored in the database
 * 
 * @param faculty - Faculty data in various possible formats
 * @returns Normalized faculty object with a name property
 */
const formatFaculty = (faculty: Faculty | string | null | undefined): { name: string } => {
  if (!faculty) return { name: 'Faculty of Computing' };
  
  if (typeof faculty === 'string') {
    return { name: faculty };
  }
  
  if (typeof faculty === 'object' && faculty !== null) {
    return { name: faculty.name || 'Faculty of Computing' };
  }
  
  return { name: 'Faculty of Computing' };
};

/**
 * GET endpoint to retrieve a user's enrolled courses
 * 
 * Fetches the list of courses a student is enrolled in and returns detailed course information
 * including course code, name, description, faculty, and instructor
 * 
 * @param request - The incoming HTTP request with user ID header
 * @returns JSON response with course details or error information
 */
export async function GET(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Fetch the student record from the database using the user ID
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (studentError) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // If the student has selected courses, fetch detailed information for each course
    if (student.courses && student.courses.length > 0) {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('*')
        .in('course_code', student.courses);
        
      if (coursesError) {
        return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 });
      }
      
      // Normalize the course data to ensure consistent structure
      // This includes formatting faculty data and providing default values
      const formattedCourses = courses.map(course => ({
        course_code: course.course_code,
        course_name: course.course_name,
        course_description: course.course_description || 'No description available',
        faculty: formatFaculty(course.faculty),
        instructor: course.instructor
      }));
      
      return NextResponse.json({ courses: formattedCourses });
    }
    
    // Return empty array if student has no courses
    return NextResponse.json({ courses: [] });
  } catch (error) {
    console.error('Error in GET courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST endpoint to add a course to a user's selection
 * 
 * Adds a new course to the student's enrolled courses list
 * Prevents duplicate course enrollments
 * 
 * @param request - The incoming HTTP request with user ID header and course code in body
 * @returns JSON response indicating success or error information
 */
export async function POST(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Extract the course code from the request body
    const { courseCode } = await request.json();
    
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    
    // Get the student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('courses')
      .eq('id', userId)
      .single();
      
    if (studentError) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Handle the case where courses might be null in the database
    const currentCourses = student.courses || [];
    
    // Prevent duplicate course enrollments
    if (currentCourses.includes(courseCode)) {
      return NextResponse.json({ message: 'Course already added' });
    }
    
    // Add the new course to the student's course list
    const updatedCourses = [...currentCourses, courseCode];
    
    // Update the student record in the database
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ courses: updatedCourses })
      .eq('id', userId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
    
    // Return success response with the updated course list
    return NextResponse.json({ 
      message: 'Course added successfully', 
      courses: updatedCourses 
    });
  } catch (error) {
    console.error('Error in POST courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE endpoint to remove a course from a user's selection
 * 
 * Removes a specified course from the student's enrolled courses list
 * Course code is provided as a URL query parameter
 * 
 * @param request - The incoming HTTP request with user ID header and course code in query params
 * @returns JSON response indicating success or error information
 */
export async function DELETE(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Extract the course code from URL query parameters
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');
    
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    
    // Get the student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('courses')
      .eq('id', userId)
      .single();
      
    if (studentError) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // Handle the case where courses might be null in the database
    const currentCourses = student.courses || [];
    // Filter out the specified course code
    const updatedCourses = currentCourses.filter((code: string) => code !== courseCode);
    
    // If array lengths are the same, the course wasn't in the list
    if (currentCourses.length === updatedCourses.length) {
      return NextResponse.json({ message: 'Course not found in selection' });
    }
    
    // Update the student record
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ courses: updatedCourses })
      .eq('id', userId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
    
    // Return success response with the updated course list
    return NextResponse.json({ 
      message: 'Course removed successfully', 
      courses: updatedCourses 
    });
  } catch (error) {
    console.error('Error in DELETE courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}