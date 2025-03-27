import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface Faculty {
  name?: string;
  [key: string]: unknown;
}

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to format faculty data
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

// GET user courses
export async function GET(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the student record with the user id
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (studentError) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    // If the student has selected courses, fetch their details
    if (student.courses && student.courses.length > 0) {
      const { data: courses, error: coursesError } = await supabaseAdmin
        .from('courses')
        .select('*')
        .in('course_code', student.courses);
        
      if (coursesError) {
        return NextResponse.json({ error: 'Error fetching courses' }, { status: 500 });
      }
      
      // Format the courses to ensure faculty is properly structured
      const formattedCourses = courses.map(course => ({
        course_code: course.course_code,
        course_name: course.course_name,
        course_description: course.course_description || 'No description available',
        faculty: formatFaculty(course.faculty),
        instructor: course.instructor
      }));
      
      return NextResponse.json({ courses: formattedCourses });
    }
    
    return NextResponse.json({ courses: [] });
  } catch (error) {
    console.error('Error in GET courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST to add a course to user's selection
export async function POST(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Parse the request body
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
    
    // Create or update courses array
    const currentCourses = student.courses || [];
    
    // Check if course already exists in selection
    if (currentCourses.includes(courseCode)) {
      return NextResponse.json({ message: 'Course already added' });
    }
    
    // Add the new course
    const updatedCourses = [...currentCourses, courseCode];
    
    // Update the student record
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({ courses: updatedCourses })
      .eq('id', userId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update courses' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Course added successfully', 
      courses: updatedCourses 
    });
  } catch (error) {
    console.error('Error in POST courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE to remove a course from user's selection
export async function DELETE(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the courseCode from URL parameters
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
    
    // Remove the course from the array
    const currentCourses = student.courses || [];
    const updatedCourses = currentCourses.filter((code: string) => code !== courseCode);
    
    // If no change, course wasn't in the list
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
    
    return NextResponse.json({ 
      message: 'Course removed successfully', 
      courses: updatedCourses 
    });
  } catch (error) {
    console.error('Error in DELETE courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 