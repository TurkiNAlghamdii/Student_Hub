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
    
    // Search in both course_code and course_name
    const { data: courses } = await supabase
      .from('courses')
      .select('course_code, course_name, faculty:faculties(name)')
      .ilike('course_code', `%${query}%`)
      .limit(5);

    if (courses.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    // Transform the results to match the expected structure
    const formattedCourses = courses.map(course => ({
      course_code: course.course_code,
      course_name: course.course_name,
      faculty: {
        name: course.faculty?.name || 'Faculty of Computing'
      }
    }));

    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    return NextResponse.json({ 
      courses: [],
      error: 'Unexpected error'
    }, { status: 500 });
  }
} 