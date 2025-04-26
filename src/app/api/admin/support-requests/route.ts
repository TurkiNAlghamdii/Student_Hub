/**
 * Admin Support Requests API Route
 * 
 * This API provides administrative functionality for managing support requests, including:
 * - Retrieving all support requests in the system
 * 
 * This endpoint is intended for admin use only and includes strict authorization checks
 * to ensure only authenticated administrators can access the data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET endpoint to fetch all support requests
 * 
 * Retrieves all support requests from the database, ordered by creation date (newest first).
 * Includes authentication and authorization checks to ensure only admins can access this data.
 * 
 * @param request - The incoming HTTP request with authentication headers
 * @returns JSON response with an array of support request objects or error information
 */
export async function GET(request: NextRequest) {
  try {
    // Verify that the Supabase admin client is properly initialized
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }

    /**
     * Authentication check
     * Verify the user is authenticated via the Authorization header
     * This uses the Bearer token authentication scheme
     */
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Extract and validate the JWT token
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    /**
     * Authorization check
     * Verify the authenticated user has admin privileges
     * This handles different formats of the is_admin flag in app_metadata
     * to ensure robust permission checking
     */
    const isAdmin = user.app_metadata?.is_admin === true || 
                   user.app_metadata?.is_admin === 'true' || 
                   String(user.app_metadata?.is_admin).toLowerCase() === 'true';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    /**
     * Fetch all support requests from the database
     * Requests are ordered by creation date (newest first) to prioritize
     * recent requests that may need immediate attention
     */
    const { data, error } = await supabaseAdmin
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return the support requests data in a structured response
    return NextResponse.json({ data });
    
  } catch (err) {
    // Global error handler for unexpected exceptions
    console.error('Internal server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}