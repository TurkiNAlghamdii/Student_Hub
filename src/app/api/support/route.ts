/**
 * Support Request API Route
 * 
 * This API handles the submission of support requests from users,
 * validating the input data and storing it in the database for
 * admin review and response.
 * 
 * The API uses Zod for input validation to ensure data integrity
 * before storing support requests in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

/**
 * Support Request Validation Schema
 * 
 * Defines the expected structure and validation rules for support request submissions:
 * - email: Must be a valid email format
 * - issue: Must be a non-empty string identifying the issue type
 * - description: Must be at least 10 characters to provide sufficient detail
 * 
 * Using Zod for validation provides type safety and clear error messages
 */
const supportRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  issue: z.string().min(1, "Issue type is required"),
  description: z.string().min(10, "Description must be at least 10 characters")
});

/**
 * POST endpoint to submit a new support request
 * 
 * Accepts support request data, validates it, and stores it in the database.
 * Returns a success response with the request ID or appropriate error messages.
 * 
 * @param request - The incoming HTTP request with support request data
 * @returns JSON response indicating success or error information
 */
export async function POST(request: NextRequest) {
  try {
    // Verify that the Supabase admin client is properly initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }

    /**
     * Parse and validate the request data
     * Using safeParse instead of parse allows us to handle validation
     * errors gracefully and return informative error messages
     */
    const body = await request.json();
    
    // Validate against our schema
    const result = supportRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Extract the validated data
    const { email, issue, description } = result.data;
    
    /**
     * Store the support request in the database
     * All new requests are given a 'new' status by default
     * We use .select() to return the created record with its generated ID
     */
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .insert([
        {
          email,                // User's email for contact
          issue_type: issue,    // Category of the issue
          description,          // Detailed explanation of the problem
          status: 'new',        // Initial status for all requests
        }
      ])
      .select();
    
    if (error) {
      console.error("Error inserting support request:", error);
      return NextResponse.json(
        { error: "Failed to save support request" },
        { status: 500 }
      );
    }
    
    /**
     * Return success response with the request ID
     * This ID can be used for future reference or to check status
     */
    return NextResponse.json({ 
      success: true, 
      message: "Support request submitted successfully",
      request_id: data[0].id
    });
    
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error("Unexpected error processing support request:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}