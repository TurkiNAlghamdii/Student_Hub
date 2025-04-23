import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DELETE endpoint to delete a user account
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

    // Verify the request body contains the password
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
    
    if (!body.password || typeof body.password !== 'string') {
      return NextResponse.json(
        { error: 'Password required for account deletion' },
        { status: 400 }
      );
    }

    // Check if the user exists in Auth
    const { data: userData, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userCheckError || !userData.user) {
      console.error('User not found in auth:', userCheckError);
      return NextResponse.json(
        { error: 'User not found in authentication system' },
        { status: 404 }
      );
    }

    console.log('User found, proceeding with deletion', userId);

    // 1. First, delete user data from the students table
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

    // 2. Then delete user authentication record
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userDeleteError) {
      console.error('Error deleting auth user:', userDeleteError);
      return NextResponse.json(
        { error: `Failed to delete auth account: ${userDeleteError.message}` },
        { status: 500 }
      );
    }

    console.log('Auth record deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Unexpected error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
} 