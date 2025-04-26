/**
 * Course Materials Report API Route
 * 
 * This API handles the reporting of inappropriate or problematic course materials
 * by users. It validates the report data, checks for duplicate reports, and stores
 * the report in the database for admin review.
 * 
 * The API supports two authentication methods:
 * 1. Header-based authentication using x-user-id
 * 2. Cookie-based authentication using Supabase session
 */

import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * POST endpoint to submit a report for a course material
 * 
 * Accepts report data including the material ID, reason for reporting,
 * and optional details. Validates the request, checks for duplicate reports,
 * and creates a new report entry in the database.
 * 
 * @param request - The incoming HTTP request with report data
 * @returns JSON response indicating success or error information
 */
export async function POST(request: Request) {
  try {
    /**
     * Parse and validate the request data
     * 
     * Required parameters:
     * - materialId: The ID of the course material being reported
     * - reason: The reason for reporting (e.g., 'inappropriate', 'copyright', etc.)
     * 
     * Optional parameters:
     * - details: Additional information about the report
     */
    const { materialId, reason, details } = await request.json()

    // Ensure all required fields are provided
    if (!materialId || !reason) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    /**
     * Authentication check using multiple methods
     * 
     * This API supports two authentication approaches:
     * 1. Header-based: Using the x-user-id header (typically from API calls)
     * 2. Cookie-based: Using Supabase session cookies (typically from browser)
     * 
     * This dual approach ensures the API works both for direct API calls
     * and for browser-based submissions.
     */
    // First try header authentication
    const userId = request.headers.get('x-user-id') || null;
    
    // If header auth fails, try cookie authentication
    let cookieUserId = null;
    if (!userId) {
      const cookieStore = cookies()
      const authClient = createRouteHandlerClient({ cookies: () => cookieStore })
      const { data: { session } } = await authClient.auth.getSession()
      
      if (session?.user) {
        cookieUserId = session.user.id;
      }
    }
    
    // Use whichever user ID we found, or return unauthorized if neither is available
    const authenticatedUserId = userId || cookieUserId;
    
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    /**
     * Check for duplicate reports
     * 
     * Prevents users from submitting multiple reports for the same material.
     * This ensures that each user can only report a specific material once,
     * preventing spam reports and database clutter.
     */
    const { data: existingReport, error: checkError } = await (supabaseAdmin || supabase)
      .from('material_reports')
      .select('id')
      .eq('material_id', materialId)
      .eq('reporter_id', authenticatedUserId)
      .single()

    // Handle database errors, but ignore "not found" errors (PGRST116)
    // since that's the expected result when no duplicate exists
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking existing report:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      )
    }

    // If a report already exists, prevent duplicate submission
    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this material' },
        { status: 400 }
      )
    }

    /**
     * Verify that the reported material exists
     * 
     * Checks the course_files table to ensure the material being reported
     * actually exists in the database. This prevents reports against
     * non-existent or deleted materials.
     */
    const { data: material, error: materialError } = await (supabaseAdmin || supabase)
      .from('course_files')
      .select('id')
      .eq('id', materialId)
      .single()

    if (materialError || !material) {
      console.error('Error verifying material:', materialError)
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    /**
     * Create the material report in the database
     * 
     * After all validation checks pass, insert a new record in the material_reports table
     * with the following information:
     * - material_id: The ID of the reported material
     * - reporter_id: The ID of the user submitting the report
     * - reason: The category/reason for the report
     * - details: Optional additional information provided by the reporter
     * - status: Initially set to 'pending' for admin review
     */
    const { data, error } = await (supabaseAdmin || supabase)
      .from('material_reports')
      .insert({
        material_id: materialId,
        reporter_id: authenticatedUserId,
        reason,
        details: details || null,
        status: 'pending'  // All new reports start as pending
      })
      .select()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    /**
     * Return success response with the created report data
     * 
     * This provides confirmation to the user that their report was submitted
     * and includes the report details for reference.
     */
    return NextResponse.json({ 
      message: 'Material reported successfully',
      report: data
    })
  } catch (error) {
    /**
     * Global error handler
     * 
     * Catches any unexpected errors in the report submission process
     * and returns a generic error message to the client while logging
     * the detailed error for debugging.
     */
    console.error('Error in report material API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}