/**
 * Comment Reporting API Route
 * 
 * This API allows students to report inappropriate or problematic comments.
 * It handles the creation of comment reports and prevents duplicate reports
 * from the same user for the same comment.
 * 
 * The API supports both header-based and cookie-based authentication methods
 * to accommodate different client implementations.
 */

import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST endpoint to create a new comment report
 * 
 * Allows users to report comments that violate community guidelines
 * Requires authentication and prevents duplicate reports
 * 
 * @param request - The incoming HTTP request with comment ID, reason, and optional details
 * @returns JSON response indicating success or error information
 */
export async function POST(request: Request) {
  try {
    // Parse the request body to extract report information
    const { commentId, reason, details } = await request.json()

    // Validate that required parameters are provided
    if (!commentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    /**
     * Authentication handling - supports two methods:
     * 1. Header-based authentication (x-user-id header)
     * 2. Cookie-based authentication (Supabase session cookie)
     * 
     * This dual approach ensures compatibility with different client implementations
     * while maintaining security requirements.
     */
    
    // First attempt: Try header-based authentication
    const userId = request.headers.get('x-user-id') || null;
    
    // Second attempt: If header auth fails, try cookie-based authentication
    let cookieUserId = null;
    if (!userId) {
      const cookieStore = cookies()
      const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { session } } = await authClient.auth.getSession()
      
      if (session?.user) {
        cookieUserId = session.user.id;
      }
    }
    
    // Use whichever authentication method succeeded
    const authenticatedUserId = userId || cookieUserId;
    
    // Return unauthorized error if no valid authentication was found
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    /**
     * Prevent duplicate reports
     * Check if this user has already reported this specific comment
     * This prevents spam reports and ensures data integrity
     */
    const { data: existingReport, error: checkError } = await (supabaseAdmin || supabase)
      .from('comment_reports')
      .select('id')
      .eq('comment_id', commentId)
      .eq('reporter_id', authenticatedUserId)
      .single()

    // Handle database errors, but ignore "not found" errors (PGRST116)
    // since we expect no existing report to be found in the normal case
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking existing report:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      )
    }

    // If a report already exists from this user for this comment, return an error
    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this comment' },
        { status: 400 }
      )
    }

    /**
     * Verify that the reported comment actually exists
     * This prevents reports against non-existent comments
     * and ensures data integrity in the reports table
     */
    const { data: comment, error: commentError } = await (supabaseAdmin || supabase)
      .from('course_comments')
      .select('id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      console.error('Error verifying comment:', commentError)
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    /**
     * Create the comment report in the database
     * All reports start with 'pending' status and will be reviewed by moderators
     * We include the reporter's ID for accountability and to prevent duplicates
     */
    const { data, error } = await (supabaseAdmin || supabase)
      .from('comment_reports')
      .insert({
        comment_id: commentId,
        reporter_id: authenticatedUserId,
        reason,
        details: details || null,  // Optional additional context from the reporter
        status: 'pending'          // All new reports start as pending
      })
      .select()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    // Return success response with the created report data
    return NextResponse.json({ 
      message: 'Comment reported successfully',
      report: data
    })
  } catch (error) {
    // Global error handler for unexpected errors
    console.error('Error in report comment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}