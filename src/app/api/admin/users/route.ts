/**
 * Admin Users API Route
 * 
 * This API provides administrative functionality for managing users, including:
 * - Retrieving all users with their profiles
 * - Updating user admin privileges
 * - Enabling/disabling user accounts
 * 
 * These endpoints are intended for admin use only and should be protected
 * by appropriate authorization checks in the frontend.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET endpoint to fetch all users with their profiles
 * 
 * Retrieves all users from Supabase Auth and enriches student users
 * with their profile information from the students table.
 * 
 * @returns JSON response with an array of users and their profiles
 */
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    /**
     * Fetch all users from Supabase Auth
     * This provides basic user information including email, metadata, and authentication details
     */
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) throw authError

    /**
     * Identify and fetch student profiles
     * We identify students by their email domain (@stu.kau.edu.sa)
     * and fetch their additional profile information from the students table
     */
    const studentEmails = authUsers.users
      .filter(user => user.email?.endsWith('@stu.kau.edu.sa'))
      .map(user => user.email)

    // Create a lookup map for student profiles by email
    let studentProfiles: Record<string, any> = {}
    if (studentEmails.length > 0) {
      // Fetch all matching student profiles in a single query for efficiency
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('students')
        .select('*')
        .in('email', studentEmails)

      if (!profileError && profiles) {
        // Convert array to a map for O(1) lookups by email
        studentProfiles = profiles.reduce((acc, profile) => {
          acc[profile.email] = profile
          return acc
        }, {})
      }
    }

    /**
     * Combine auth data with student profiles
     * This creates a comprehensive user object that includes both
     * authentication data and profile information where available
     */
    const usersWithProfiles = authUsers.users.map(user => ({
      ...user,
      student_profile: studentProfiles[user.email || ''] || null
    }))

    // Return the combined user data
    return NextResponse.json({ users: usersWithProfiles })
  } catch (err) {
    // Handle any errors during the user fetching process
    console.error('Error fetching users:', err)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * PUT endpoint to update a user's admin status
 * 
 * Grants or revokes admin privileges for a specified user by
 * updating their app_metadata in Supabase Auth.
 * 
 * @param request - The incoming HTTP request with userId and isAdmin flag
 * @returns JSON response indicating success or error information
 */
export async function PUT(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    // Parse the request body to extract user ID and admin status
    const body = await request.json()
    console.log('PUT request body:', body)
    
    const { userId, isAdmin } = body
    
    // Validate that a user ID was provided
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Updating user admin status:', { userId, isAdmin })

    /**
     * Update the user's admin status in Supabase Auth
     * This sets the is_admin flag in the user's app_metadata,
     * which is used for authorization checks throughout the application
     */
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { is_admin: isAdmin } }
    )

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    /**
     * Verify that the update was successful by fetching the user again
     * This is a safety check to ensure the metadata was properly updated
     * and provides helpful debugging information in the logs
     */
    const { data: updatedUser, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (verifyError) {
      console.error('Error verifying update:', verifyError)
    } else {
      console.log('Updated user metadata:', updatedUser.user.app_metadata)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH endpoint to enable or disable a user account
 * 
 * Updates a user's disabled status by setting the is_disabled flag
 * in their user_metadata. This can be used to temporarily suspend
 * access without deleting the account.
 * 
 * @param request - The incoming HTTP request with userId and isDisabled flag
 * @returns JSON response indicating success or error information
 */
export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      )
    }

    // Parse the request body to extract user ID and disabled status
    const { userId, isDisabled } = await request.json()
    
    // Validate that a user ID was provided
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    /**
     * Update the user's disabled status in Supabase Auth
     * This sets the is_disabled flag in the user's user_metadata,
     * which can be checked during authentication to prevent access
     */
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { is_disabled: isDisabled } }
    )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating user:', err)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
} 