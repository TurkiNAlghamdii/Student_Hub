/**
 * Student Starred Materials File API Route
 * 
 * This API provides functionality for toggling the starred status of a specific file for a student.
 * It implements a toggle pattern where:
 * - If the file is not currently starred, it will be added to the student's starred materials
 * - If the file is already starred, it will be removed from the student's starred materials
 * 
 * The API includes authorization checks to ensure that students can only manage their own starred materials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Helper function to validate UUID format
 * 
 * Ensures that the provided string is a valid UUID in the format:
 * xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
 * where M is 1-5 and N is 8, 9, a, or b
 * 
 * This validation is important for security to prevent SQL injection
 * and ensure that the IDs are in the expected format before querying the database.
 * 
 * @param uuid - The string to validate as a UUID
 * @returns Boolean indicating whether the string is a valid UUID
 */
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * POST endpoint to toggle the starred status of a file for a student
 * 
 * This endpoint implements a toggle behavior:
 * - If the file is not currently starred by the student, it will be starred
 * - If the file is already starred by the student, the star will be removed
 * 
 * Authorization: Only the student themselves can star/unstar their own materials
 * 
 * @param request - The incoming HTTP request with authentication header
 * @param params - Route parameters containing the studentId and fileId
 * @returns JSON response indicating the new starred status or error information
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string; fileId: string } }
) {
  /**
   * Extract and validate request parameters
   * 
   * The studentId and fileId come from the URL path, and we need to ensure
   * the request includes proper authentication via the x-user-id header
   */
  const { studentId, fileId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Reject requests without authentication
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized - Missing auth header' }, { status: 401 });
  }
  
  /**
   * Authorization check
   * 
   * This API enforces that students can only star/unstar their own materials.
   * Unlike the GET endpoint, even admins cannot modify another student's starred materials.
   * This is a design decision to maintain clear ownership of starred content.
   */
  if (authHeader !== studentId) {
    return NextResponse.json({ error: 'Forbidden - Cannot star materials for another student' }, { status: 403 });
  }
  
  /**
   * Validate UUID format for security
   * 
   * This check ensures that the IDs are properly formatted UUIDs before
   * using them in database queries, which helps prevent SQL injection
   * and ensures data integrity.
   */
  if (!isValidUUID(studentId) || !isValidUUID(fileId)) {
    return NextResponse.json({ 
      error: 'Invalid ID format', 
      details: 'Student ID and File ID must be valid UUIDs',
      studentId,
      fileId
    }, { status: 400 });
  }
  
  try {
    /**
     * Check if the material is already starred by this student
     * 
     * Uses maybeSingle() to handle both cases (existing or not) without errors.
     * This query only retrieves the ID field since we only need to know if the
     * record exists, not its full details.
     */
    // Ensure supabaseAdmin is available before using it
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database client not initialized',
      }, { status: 500 });
    }
    
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('student_starred_materials')
      .select('id')  // Only need the ID to check existence
      .eq('student_id', studentId)
      .eq('file_id', fileId)
      .maybeSingle();  // Returns null if not found, instead of throwing an error
    
    // Handle database errors
    if (checkError) {
      return NextResponse.json({ 
        error: 'Failed to check if material is starred', 
        details: checkError.message,
        code: checkError.code
      }, { status: 500 });
    }
    
    let result;
    
    /**
     * Toggle logic - Part 1: Unstar if already starred
     * 
     * If the material is already starred (existingData is not null),
     * remove the star by deleting the record from the database.
     */
    if (existingData) {
      // Ensure supabaseAdmin is still available
      if (!supabaseAdmin) {
        return NextResponse.json({ 
          error: 'Database client not initialized',
        }, { status: 500 });
      }
      
      // Delete the existing star record
      const { error: deleteError } = await supabaseAdmin
        .from('student_starred_materials')
        .delete()
        .eq('student_id', studentId)
        .eq('file_id', fileId);
      
      // Handle deletion errors
      if (deleteError) {
        return NextResponse.json({ 
          error: 'Failed to remove star from material', 
          details: deleteError.message,
          code: deleteError.code 
        }, { status: 500 });
      }
      
      // Return success response for unstarring
      result = { status: 'unstarred', file_id: fileId };
    } 
    /**
     * Toggle logic - Part 2: Star if not already starred
     * 
     * If the material is not currently starred (existingData is null),
     * add a star by creating a new record in the database.
     * 
     * Before adding the star, we verify that both the student and file exist
     * to maintain referential integrity and provide better error messages.
     */
    else {
      /**
       * Verify that the student exists
       * 
       * Uses a count query with head:true for efficiency (doesn't return actual data)
       * This prevents creating orphaned records that reference non-existent students
       */
      // Ensure supabaseAdmin is still available
      if (!supabaseAdmin) {
        return NextResponse.json({ 
          error: 'Database client not initialized',
        }, { status: 500 });
      }
      
      const { count: studentCount, error: studentCountError } = await supabaseAdmin
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('id', studentId);
      
      // Handle student verification errors
      if (studentCountError) {
        return NextResponse.json({ 
          error: 'Failed to verify student ID', 
          details: studentCountError.message 
        }, { status: 500 });
      }
      
      // Return 404 if student doesn't exist
      if (studentCount === 0) {
        return NextResponse.json({ 
          error: 'Student not found', 
          details: `No student with ID ${studentId}` 
        }, { status: 404 });
      }
      
      /**
       * Verify that the file exists
       * 
       * Similar to student verification, ensures the file exists before
       * creating a star record that references it
       */
      // Ensure supabaseAdmin is still available
      if (!supabaseAdmin) {
        return NextResponse.json({ 
          error: 'Database client not initialized',
        }, { status: 500 });
      }
      
      const { count: fileCount, error: fileCountError } = await supabaseAdmin
        .from('course_files')
        .select('*', { count: 'exact', head: true })
        .eq('id', fileId);
      
      // Handle file verification errors
      if (fileCountError) {
        return NextResponse.json({ 
          error: 'Failed to verify file ID', 
          details: fileCountError.message 
        }, { status: 500 });
      }
      
      // Return 404 if file doesn't exist
      if (fileCount === 0) {
        return NextResponse.json({ 
          error: 'File not found', 
          details: `No file with ID ${fileId}` 
        }, { status: 404 });
      }
      
      /**
       * Create the star record
       * 
       * After verifying both the student and file exist, create a new record
       * in the student_starred_materials table to represent the star
       */
      // Ensure supabaseAdmin is still available
      if (!supabaseAdmin) {
        return NextResponse.json({ 
          error: 'Database client not initialized',
        }, { status: 500 });
      }
      
      const { error: insertError } = await supabaseAdmin
        .from('student_starred_materials')
        .insert({
          student_id: studentId,  // The student who is starring the material
          file_id: fileId        // The material being starred
          // Note: starred_at timestamp is set automatically by the database
        });
      
      // Handle insertion errors
      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to star material', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint || 'No hint available'
        }, { status: 500 });
      }
      
      // Return success response for starring
      result = { status: 'starred', file_id: fileId };
    }
    
    // Return the result of the toggle operation
    return NextResponse.json(result);
    
  } catch (error: unknown) {
    /**
     * Global error handler
     * 
     * Catches any unexpected errors in the process and returns
     * a user-friendly error response while logging the detailed
     * error for debugging purposes.
     * 
     * In development mode, includes the error stack for debugging.
     */
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage,
      // Only include stack trace in development environment
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
    }, { status: 500 });
  }
}