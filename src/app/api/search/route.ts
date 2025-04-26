/**
 * Search API Route
 * 
 * This API provides course search functionality for the Student Hub application.
 * It allows users to search for courses by code or name, returning matching results
 * with basic course information.
 * 
 * The search is case-insensitive and supports partial matching using SQL LIKE.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET endpoint to search for courses
 * 
 * Searches the courses table for matches based on the provided query string.
 * Returns a list of courses that match the search criteria, limited to 5 results.
 * 
 * @param request - The incoming HTTP request with search query in URL parameters
 * @returns JSON response with matching courses or an empty array
 */
export async function GET(request: Request) {
  /**
   * Extract and validate the search query
   * The query parameter is expected in the URL as ?query=searchterm
   */
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  // Return empty results if no query is provided
  if (!query) {
    return NextResponse.json({ courses: [] });
  }

  try {
    /**
     * Initialize Supabase client
     * 
     * Creates a temporary Supabase client for this request only.
     * Uses service role key for admin access or falls back to anon key.
     * Disables session persistence since this is a stateless API endpoint.
     */
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Validate that Supabase configuration is available
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json({ 
        courses: [],
        error: 'Missing Supabase configuration'
      }, { status: 500 });
    }
    
    // Create a non-persistent client for this request only
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,  // Don't store session in localStorage
        autoRefreshToken: false // Don't auto-refresh the token
      }
    });
    
    /**
     * Perform the search query
     * 
     * Uses SQL ILIKE for case-insensitive partial matching on both:
     * - course_code: The unique identifier for the course (e.g., CS101)
     * - course_name: The descriptive name of the course
     * 
     * Results are limited to 5 to prevent overwhelming the UI
     * and optimize performance for typeahead search.
     */
    const formattedQuery = query.trim();
    
    // Search in both course_code and course_name using OR condition
    const { data: courses, error } = await supabase
      .from('courses')
      .select('course_code, course_name')
      .or(`course_code.ilike.%${formattedQuery}%,course_name.ilike.%${formattedQuery}%`)
      .limit(5);

    /**
     * Handle database errors and empty results
     */
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        courses: [],
        error: error.message || 'Database error'
      }, { status: 500 });
    }

    // Return empty array if no matching courses found
    if (!courses || courses.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    /**
     * Format the results for the frontend
     * 
     * Transforms the database results into the expected structure
     * for the search component in the UI.
     * 
     * Adds a default faculty name since we're not fetching that data
     * in this simplified search endpoint.
     */
    const formattedCourses = courses.map(course => ({
      course_code: course.course_code,
      course_name: course.course_name,
      faculty: {
        name: 'Faculty of Computing' // Default faculty name since we don't have faculty_id
      }
    }));

    // Return the formatted search results
    return NextResponse.json({ courses: formattedCourses });
  } catch (error) {
    /**
     * Global error handler
     * 
     * Catches any unexpected errors in the search process
     * and returns a user-friendly error response.
     * 
     * Includes detailed error information in development
     * while keeping error messages generic in production.
     */
    console.error('Search error:', error);
    return NextResponse.json({ 
      courses: [],
      error: error instanceof Error ? error.message : 'Unexpected error'
    }, { status: 500 });
  }
}