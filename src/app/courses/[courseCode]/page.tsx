import React from 'react'
import { createClient } from '@supabase/supabase-js'
import CourseClient from './CourseClient';
import { notFound } from 'next/navigation';

interface CourseDetails {
  course_code: string
  course_name: string
  course_description: string
  faculty: {
    name: string
  }
}

// This is a server component
export default async function CoursePage({ params }: { params: { courseCode: string } }) {
  // Make sure params is properly resolved before accessing courseCode
  const resolvedParams = await Promise.resolve(params);
  const courseCode = resolvedParams.courseCode;
  
  if (!courseCode) {
    return notFound();
  }

  let course: CourseDetails | null = null;
  let error: string | null = null;

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Fetch course from Supabase
    const { data, error: supabaseError } = await supabase
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .single();
    
    if (supabaseError) {
      throw new Error(`Error fetching course: ${supabaseError.message}`);
    }
    
    if (!data) {
      error = `Course ${courseCode} not found`;
    } else {
      // Format the course data
      course = {
        course_code: data.course_code,
        course_name: data.course_name,
        course_description: data.course_description || 'No description available',
        faculty: {
          name: getFacultyName(data.faculty)
        }
      };
    }
  } catch (err: any) {
    error = err.message || 'An unexpected error occurred';
  }

  // Return the client component with the course data or error
  return <CourseClient course={course} error={error} />;
}

function getFacultyName(faculty: any): string {
  if (!faculty) return 'Faculty of Computing';
  
  if (typeof faculty === 'string') {
    return faculty;
  }
  
  if (typeof faculty === 'object' && faculty !== null) {
    return faculty.name || 'Faculty of Computing';
  }
  
  return 'Faculty of Computing';
} 