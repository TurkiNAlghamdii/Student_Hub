/**
 * Course Detail Page Component
 * 
 * This is a server component that fetches detailed information about a specific course
 * based on the course code provided in the URL parameters. It handles data fetching,
 * error states, and data transformation before rendering the course details.
 * 
 * The component uses Supabase service role key to bypass Row Level Security (RLS)
 * since course data is public and doesn't require user authentication.
 */

import React from 'react'
import { createClient } from '@supabase/supabase-js'
import CourseClient from './CourseClient';
import { notFound } from 'next/navigation';

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
 * CourseDetails Interface
 * 
 * Defines the structure of a detailed course object as retrieved and processed
 * from the database. Contains comprehensive course information including:
 * - course_code: Unique identifier for the course (e.g., "CPIT-201")
 * - course_name: Full name of the course
 * - course_description: Detailed description of the course content
 * - Instractions: Additional instructions for the course (note the typo in the field name)
 * - faculty: Object containing the faculty name
 */
interface CourseDetails {
  course_code: string
  course_name: string
  course_description: string
  Instractions: string | null
  faculty: {
    name: string
  }
}

/**
 * CoursePage Component
 * 
 * Server component responsible for fetching detailed data for a specific course.
 * Handles the entire data fetching process including:
 * 1. Extracting and validating the course code from URL parameters
 * 2. Creating a Supabase client with appropriate credentials
 * 3. Fetching the specific course from the database
 * 4. Handling potential errors during the fetch process
 * 5. Transforming raw database data into the expected CourseDetails format
 * 6. Passing the processed data to the client component
 * 
 * @param params - Object containing the courseCode from the dynamic route
 * @returns A rendered CourseClient component with course data or error state
 */
export default async function CoursePage({ params }: { params: { courseCode: string } }) {
  /**
   * Extract and Validate Course Code
   * 
   * Ensures the course code parameter is properly resolved from the URL parameters.
   * If no course code is provided, returns the Next.js notFound() response,
   * which will render the 404 page.
   */
  const resolvedParams = await Promise.resolve(params);
  const courseCode = resolvedParams.courseCode;
  
  if (!courseCode) {
    return notFound();
  }

  let course: CourseDetails | null = null;
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
     * 
     * Additional validation ensures the required environment variables are present.
     */
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
    
    /**
     * Fetch Course Data
     * 
     * Retrieves a specific course from the 'courses' table in Supabase.
     * The query:
     * - Selects all fields for the course record
     * - Filters by the course_code from the URL parameters
     * - Uses .single() to expect exactly one result or an error
     * 
     * Any database errors are caught and re-thrown with a descriptive message.
     */
    const { data, error: supabaseError } = await supabase
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .single();
    
    if (supabaseError) {
      throw new Error(`Error fetching course: ${supabaseError.message}`);
    }
    
    /**
     * Process Fetched Data
     * 
     * Handles two possible scenarios:
     * 1. No data returned - Sets an error message with the course code
     * 2. Data available - Maps raw database record to the CourseDetails interface format
     * 
     * During mapping, the function:
     * - Preserves course code and name as-is
     * - Provides a default description if none exists
     * - Preserves instructions field (note the typo 'Instractions' is maintained for compatibility)
     * - Normalizes faculty data through the getFacultyName helper
     */
    if (!data) {
      error = `Course ${courseCode} not found`;
    } else {
      // Format the course data
      course = {
        course_code: data.course_code,
        course_name: data.course_name,
        course_description: data.course_description || 'No description available',
        Instractions: data.Instractions || null,
        faculty: {
          name: getFacultyName(data.faculty)
        }
      };
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
   * - The successfully fetched and processed course data, or
   * - An error message if something went wrong during data fetching
   * 
   * The client component handles the actual rendering and user interactions.
   */
  return <CourseClient course={course} error={error} />;
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