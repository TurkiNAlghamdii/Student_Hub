import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return NextResponse.json({ courses: [] });
  }

  try {
    // Create a new Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ 
        courses: [],
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Format the search query for SQL LIKE
    const formattedQuery = query.trim();
    
    // Search in both course_code and course_name
    const { data: courses, error } = await supabase
      .from('courses')
      .select('course_code, course_name')
      .or(`course_code.ilike.%${formattedQuery}%,course_name.ilike.%${formattedQuery}%`)
      .limit(5);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        courses: [],
        error: error.message || 'Database error'
      }, { status: 500 });
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    // Transform the results to match the expected structure
    const formattedCourses = courses.map(course => ({
      course_code: course.course_code,
      course_name: course.course_name,
      faculty: {
        name: 'Faculty of Computing' // Default faculty name since we don't have faculty_id
      }
    }));

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      courses: [],
      error: error instanceof Error ? error.message : 'Unexpected error'
    }, { status: 500 });
  }
} 