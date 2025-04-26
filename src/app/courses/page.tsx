/**
 * Courses Page Component
 * 
 * This is a server component that fetches all courses from the database
 * and passes them to the client component for rendering. It handles data
 * fetching, error states, and data transformation before rendering.
 * 
 * The component uses Supabase service role key to bypass Row Level Security (RLS)
 * since course data is public and doesn't require user authentication.
 */

import { createClient } from '@supabase/supabase-js'
import CoursesClient from './CoursesClient'

/**
 * Faculty Interface
 * 
 * Represents a faculty object which may come in different formats from the database.
 * The interface allows for a flexible structure with optional name property
 * and additional unknown properties through index signature.
 */
interface Faculty {
  name?: string;
  [key: string]: unknown;
}

/**
 * Course Interface
 * 
 * Defines the structure of a course object as retrieved and processed
 * from the database. Contains essential course information including:
 * - course_code: Unique identifier for the course (e.g., "CPIT-201")
 * - course_name: Full name of the course
 * - course_description: Detailed description of the course content
 * - credits: Number of credit hours for the course
 * - prerequisites: Optional string listing prerequisite courses
 * - faculty: Optional object containing the faculty name
 */
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

/**
 * CoursesPage Component
 * 
 * Server component responsible for fetching course data from Supabase.
 * Handles the entire data fetching process including:
 * 1. Creating a Supabase client with appropriate credentials
 * 2. Fetching all courses from the database
 * 3. Handling potential errors during the fetch process
 * 4. Transforming raw database data into the expected Course format
 * 5. Passing the processed data to the client component
 * 
 * @returns A rendered CoursesClient component with courses data or error state
 */
export default async function CoursesPage() {
  let courses: Course[] = [];
  let error: string | null = null;

  try {
    /**
     * Initialize Supabase Client
     * 
     * Creates a Supabase client with service role key to bypass Row Level Security.
     * This is appropriate for public data like courses that don't require
     * user-specific permissions.
     * 
     * The client is configured with:
     * - No session persistence (server-side only usage)
     * - No auto token refresh (not needed for single request)
     */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    /**
     * Fetch Courses Data
     * 
     * Retrieves all courses from the 'courses' table in Supabase.
     * The query selects all fields for each course record.
     * Any database errors are caught and re-thrown with a descriptive message.
     */
    const { data, error: supabaseError } = await supabase
      .from('courses')
      .select('*');
    
    if (supabaseError) {
      throw new Error(`Error fetching courses: ${supabaseError.message}`);
    }
    
    /**
     * Process Fetched Data
     * 
     * Handles two possible scenarios:
     * 1. No data returned (empty array or null) - Sets an error message
     * 2. Data available - Maps raw database records to the Course interface format
     * 
     * During mapping, the function:
     * - Preserves course code and name as-is
     * - Provides a default description if none exists
     * - Sets default credits to 3 if not specified
     * - Normalizes faculty data through the getFacultyName helper
     */
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
    /**
     * Error Handling
     * 
     * Catches any exceptions thrown during the data fetching process.
     * Extracts a meaningful error message if the error is an Error instance,
     * otherwise falls back to a generic error message.
     */
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    error = errorMessage;
  }

  /**
   * Render Client Component
   * 
   * Returns the client-side component with either:
   * - The successfully fetched and processed courses data, or
   * - An error message if something went wrong during data fetching
   * 
   * The client component handles the actual rendering and user interactions.
   */
  return <CoursesClient courses={courses} error={error} />;
}

/**
 * Get Faculty Name Helper Function
 * 
 * Normalizes faculty data which may come in different formats from the database:
 * - null/undefined: Returns default faculty name
 * - string: Uses the string directly as faculty name
 * - object: Extracts the name property or uses default if not present
 * 
 * This function ensures consistent faculty name formatting regardless of
 * how the data is stored in the database.
 * 
 * @param faculty - Faculty data in various possible formats
 * @returns Normalized faculty name as a string
 */
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