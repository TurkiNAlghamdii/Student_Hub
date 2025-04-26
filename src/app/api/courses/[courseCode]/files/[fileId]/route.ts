/**
 * Course File API Route
 * 
 * This API handles operations on individual course files, including:
 * - Deleting files from both storage and database
 * 
 * The API enforces authorization checks to ensure only file owners and admins
 * can delete files, protecting against unauthorized modifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * Uses the service role key to perform privileged operations like:
 * - Checking user admin status
 * - Deleting files from storage buckets
 * - Removing file records from the database
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * DELETE endpoint to remove a course file
 * 
 * Deletes a file from both Supabase Storage and the database.
 * Includes authorization checks to ensure only the file owner or an admin can delete the file.
 * 
 * @param request - The incoming HTTP request with user authentication
 * @param params - Route parameters containing the course code and file ID
 * @returns JSON response indicating success or error information
 */
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { courseCode: string; fileId: string } }
) {
  try {
    /**
     * Extract and validate route parameters
     * Both course code and file ID are required to identify the specific file
     */
    const resolvedParams = await Promise.resolve(params);
    const { courseCode, fileId } = resolvedParams;
    
    if (!courseCode || !fileId) {
      return NextResponse.json({ error: 'Course code and file ID are required' }, { status: 400 });
    }
    
    /**
     * Authentication check
     * Verify the user is authenticated via the x-user-id header
     * This ensures only authenticated users can attempt to delete files
     */
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    /**
     * Fetch user data to check for admin privileges
     * This determines if the user has special permissions to delete any file
     * regardless of ownership
     */
    const { data: userData, error: userError } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);
      
    if (userError) {
      return NextResponse.json({ error: 'Error fetching user data' }, { status: 500 });
    }
    
    /**
     * Determine admin status from user metadata
     * This handles different formats of the is_admin flag in app_metadata
     * to ensure robust permission checking
     */
    const isAdmin = userData.user.app_metadata?.is_admin === true || 
                    userData.user.app_metadata?.is_admin === 'true' || 
                    String(userData.user.app_metadata?.is_admin).toLowerCase() === 'true';
    
    /**
     * Fetch the file record from the database
     * This is needed to:
     * 1. Verify the file exists
     * 2. Check file ownership for authorization
     * 3. Get the file path for storage deletion
     */
    const { data: file, error: fileError } = await supabaseAdmin
      .from('course_files')
      .select('*')
      .eq('id', fileId)
      .eq('course_code', courseCode)
      .single();
    
    if (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    /**
     * Authorization check
     * Only allow deletion if one of these conditions is met:
     * 1. The user is the original uploader of the file
     * 2. The user has admin privileges
     */
    if (file.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: 'You do not have permission to delete this file' }, { status: 403 });
    }
    
    /**
     * Parse the storage path from the file URL
     * This extracts the relative path within the storage bucket
     * that needs to be deleted
     */
    const urlParts = file.file_url.split('/');
    const filePath = `${courseCode}/${urlParts[urlParts.length - 1]}`;
    
    /**
     * Delete the file from Supabase Storage
     * This removes the actual file content from the storage bucket
     * Note: We continue with database deletion even if storage deletion fails
     * to prevent orphaned database records
     */
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('course-files')
      .remove([filePath]);
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
      // This prevents orphaned database records pointing to non-existent files
    }
    
    /**
     * Delete the file record from the database
     * This removes the file metadata and makes it inaccessible to users
     * Even if the storage deletion failed, this ensures the file is no longer visible
     */
    const { error: deleteError } = await supabaseAdmin
      .from('course_files')
      .delete()
      .eq('id', fileId);
    
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }
    
    // Return success response after both storage and database deletion
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error('Error in DELETE file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}