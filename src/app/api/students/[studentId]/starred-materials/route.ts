/**
 * Student Starred Materials API Route
 * 
 * This API provides endpoints for managing and retrieving a student's starred materials.
 * It includes functionality to:
 * - Get a list of all starred materials for a student with full details
 * - Get only the IDs of starred materials (lightweight version)
 * 
 * The API includes authorization checks to ensure that only the student themselves
 * or an admin can access the starred materials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * GET endpoint to retrieve all starred materials for a student
 * 
 * Returns a list of materials that the student has starred, including
 * full details about each material (file metadata, course information, etc.)
 * 
 * Authorization: Only the student themselves or an admin can access this endpoint
 * 
 * @param request - The incoming HTTP request with authentication header
 * @param params - Route parameters containing the studentId
 * @returns JSON response with starred materials or error information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  /**
   * Extract and validate request parameters
   * 
   * The studentId comes from the URL path, and we need to ensure
   * the request includes proper authentication via the x-user-id header
   */
  const { studentId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Reject requests without authentication
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  /**
   * Authorization check
   * 
   * Verify that the requesting user has permission to view this student's starred materials.
   * There are two cases where access is allowed:
   * 1. The requesting user is the student themselves (authHeader === studentId)
   * 2. The requesting user is an admin (has is_admin flag in their app_metadata)
   */
  if (authHeader !== studentId) {
    // If not the student themselves, check if the user is an admin
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader);
    
    // Handle authentication errors
    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin status in user metadata
    const isAdmin = userData.user?.app_metadata?.is_admin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  try {
    /**
     * Fetch starred materials from the database
     * 
     * Retrieves all materials starred by this student, including:
     * - The file ID and when it was starred
     * - All details about the course file (using the '*' selector)
     * 
     * Results are ordered by starred_at date in descending order (newest first)
     */
    // Ensure supabaseAdmin is available before using it
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database client not initialized',
      }, { status: 500 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('student_starred_materials')
      .select('file_id, starred_at, course_files(*)')
      .eq('student_id', studentId)
      .order('starred_at', { ascending: false });
    
    // Handle database errors
    if (error) {
      console.error('Error fetching starred materials:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch starred materials',
        details: error.message
      }, { status: 500 });
    }
    
    // Return the starred materials (or empty array if none found)
    return NextResponse.json({ starred_materials: data || [] });
    
  } catch (error: unknown) {
    /**
     * Global error handler
     * 
     * Catches any unexpected errors in the process and returns
     * a user-friendly error response while logging the detailed
     * error for debugging purposes.
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in GET starred materials:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 });
  }
}

/**
 * HEAD endpoint to retrieve only the IDs of starred materials
 * 
 * This is a lightweight version of the GET endpoint that only returns
 * the file IDs without the full file details. It uses HTTP headers to
 * return the data, following the convention for HEAD requests.
 * 
 * This endpoint is useful for quickly checking if specific files are starred
 * without the overhead of fetching all file details.
 * 
 * Authorization: Only the student themselves or an admin can access this endpoint
 * 
 * @param request - The incoming HTTP request with authentication header
 * @param params - Route parameters containing the studentId
 * @returns Response with starred file IDs in X-Starred-Files header
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  /**
   * Extract and validate request parameters
   * 
   * Similar to the GET endpoint, but returns HTTP status codes
   * without response bodies, following HEAD request conventions
   */
  const { studentId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Reject requests without authentication
  if (!authHeader) {
    return new NextResponse(null, { status: 401 });
  }
  
  /**
   * Authorization check
   * 
   * Same authorization logic as the GET endpoint, but with
   * responses appropriate for a HEAD request (no response body)
   */
  if (authHeader !== studentId) {
    // If not the student themselves, check if the user is an admin
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader);
    
    // Handle authentication errors
    if (userError || !userData) {
      return new NextResponse(null, { status: 401 });
    }
    
    // Check admin status in user metadata
    const isAdmin = userData.user?.app_metadata?.is_admin;
    if (!isAdmin) {
      return new NextResponse(null, { status: 403 });
    }
  }
  
  try {
    /**
     * Fetch only the file IDs of starred materials
     * 
     * This is more efficient than the GET endpoint as it only
     * retrieves the file_id field without any joins or additional data
     */
    // Ensure supabaseAdmin is available before using it
    if (!supabaseAdmin) {
      return new NextResponse(null, { 
        status: 500,
        headers: {
          'X-Error': 'Database client not initialized'
        }
      });
    }
    
    const { data, error } = await supabaseAdmin
      .from('student_starred_materials')
      .select('file_id')
      .eq('student_id', studentId);
    
    // Handle database errors by setting an X-Error header
    if (error) {
      console.error('Error fetching starred file IDs:', error);
      return new NextResponse(null, { 
        status: 500,
        headers: {
          'X-Error': error.message
        }
      });
    }
    
    /**
     * Return the file IDs in a custom header
     * 
     * Since HEAD requests don't have response bodies, we use
     * a custom HTTP header (X-Starred-Files) to return the data
     */
    const fileIds = data.map(item => item.file_id);
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Starred-Files': JSON.stringify(fileIds)  // JSON array of file IDs
      }
    });
    
  } catch (error: unknown) {
    /**
     * Global error handler for HEAD requests
     * 
     * Similar to the GET endpoint's error handler, but returns
     * the error message in a header instead of the response body
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in HEAD starred materials:', error);
    return new NextResponse(null, { 
      status: 500,
      headers: {
        'X-Error': errorMessage  // Return error in header for HEAD requests
      }
    });
  }
}