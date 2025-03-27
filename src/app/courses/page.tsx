import { createClient } from '@supabase/supabase-js'
import CoursesClient from './CoursesClient'

interface Faculty {
  name?: string;
  [key: string]: unknown;
}

// Define the course interface
interface Course {
  course_code: string
  course_name: string
  course_description: string
  credits: number
  prerequisites?: string
  faculty?: {
    name: string
  }
}

// This is a server component that fetches data
export default async function CoursesPage() {
  let courses: Course[] = [];
  let error: string | null = null;

  try {
    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Fetch courses from Supabase
    const { data, error: supabaseError } = await supabase
      .from('courses')
      .select('*');
    
    if (supabaseError) {
      throw new Error(`Error fetching courses: ${supabaseError.message}`);
    }
    
    if (!data || data.length === 0) {
      error = 'No courses found';
    } else {
      // Format the courses data
      courses = data.map(course => ({
        course_code: course.course_code,
        course_name: course.course_name,
        course_description: course.course_description || 'No description available',
        credits: course.credits || 3, // Default to 3 credits if not specified
        prerequisites: course.prerequisites,
        faculty: {
          name: getFacultyName(course.faculty)
        }
      }));
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    error = errorMessage;
  }

  // Return the client component with the courses data or error
  return <CoursesClient courses={courses} error={error} />;
}

function getFacultyName(faculty: Faculty | string | null | undefined): string {
  if (!faculty) return 'Faculty of Computing';
  
  if (typeof faculty === 'string') {
    return faculty;
  }
  
  if (typeof faculty === 'object' && faculty !== null) {
    return faculty.name || 'Faculty of Computing';
  }
  
  return 'Faculty of Computing';
}