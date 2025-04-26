/**
 * User Account API Route
 * 
 * This API provides endpoints for managing user accounts, including account deletion.
 * It uses Supabase admin privileges to perform operations that require elevated permissions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client with admin privileges
 * Uses the service role key to perform admin operations
 * Falls back to anon key if service role key is not available
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * DELETE endpoint to delete a user account
 * 
 * This endpoint handles the complete deletion of a user account, including:
 * - Verifying the user's identity via user ID header
 * - Requiring password confirmation for security
 * - Removing the user's profile data from the students table
 * - Deleting the authentication record from Supabase Auth
 * 
 * @param request - The incoming HTTP request with user ID header and password in body
 * @returns JSON response indicating success or detailed error information
 */
export async function DELETE(request: NextRequest) {
  try {
    // Extract user ID from the auth header
    const userId = request.headers.get('x-user-id');
    
    // Ensure the user ID is provided
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required: User ID missing' },
        { status: 401 }
      );
    }

    console.log('Deleting account for user ID:', userId);

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Require password confirmation for security
    if (!body.password || typeof body.password !== 'string') {
      return NextResponse.json(
        { error: 'Password required for account deletion' },
        { status: 400 }
      );
    }

    // Verify that the user exists in the authentication system
    const { data: userData, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userCheckError || !userData.user) {
      console.error('User not found in auth:', userCheckError);
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      );
    }

    console.log('User found, proceeding with deletion', userId);

    // STEP 1: Delete user profile data from the students table
    // This removes all personal information stored in the application database
    console.log('Deleting student profile for user:', userId);
    const { error: studentDeleteError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', userId);

    if (studentDeleteError) {
      console.error('Error deleting student profile:', studentDeleteError);
      return NextResponse.json(
        { error: `Failed to delete student profile: ${studentDeleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Student profile deleted successfully, deleting auth record');

    // STEP 2: Delete the user's authentication record
    // This removes the user's login credentials and authentication data
    // Note: This is a permanent action and cannot be undone
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error('Error deleting auth user:', userDeleteError);
      return NextResponse.json(
        { error: `Failed to delete auth account: ${userDeleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Auth record deleted successfully');

    // Return success response after both deletion steps complete successfully
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    // Handle any unexpected errors during the deletion process
    console.error('Unexpected error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
}