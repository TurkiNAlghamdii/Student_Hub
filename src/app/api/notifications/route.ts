/**
 * Notifications API Route
 * 
 * This API handles user notification operations, including:
 * - Fetching a user's notifications with pagination
 * - Marking specific or all notifications as read
 * 
 * The API enforces authentication via the x-user-id header
 * and provides count information for unread notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * Uses the service role key to perform privileged database operations
 * such as reading and updating notifications across users.
 * The admin client is required to access the notifications table
 * which is protected by row-level security.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET endpoint to fetch a user's notifications
 * 
 * Retrieves notifications for the authenticated user with pagination support.
 * Also provides a count of unread notifications for badge displays.
 * 
 * @param request - The incoming HTTP request with user authentication header
 * @returns JSON response with notifications array and count information
 */
export async function GET(request: Request) {
  try {
    /**
     * Authentication check
     * Verify the user is authenticated via the x-user-id header
     * This header is set by the client after successful authentication
     */
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.log('No user ID provided in request headers');
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    console.log(`Fetching notifications for user: ${userId}`);

    /**
     * Parse pagination parameters from query string
     * These control how many notifications are returned and from which position
     * Default values ensure reasonable behavior when parameters aren't specified
     */
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');  // Default: 50 items per page
    const offset = parseInt(searchParams.get('offset') || '0'); // Default: start from beginning
    
    /**
     * Fetch paginated notifications for the user
     * - Filters by user_id to ensure privacy
     * - Orders by creation date (newest first)
     * - Applies pagination using the range function
     */
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Supabase error fetching notifications:', error);
      return NextResponse.json(
        { error: `Failed to fetch notifications: ${error.message}` },
        { status: 500 }
      );
    }

    /**
     * Count unread notifications for the notification badge
     * Uses a separate optimized query with head:true to only get the count
     * without retrieving the actual notification data
     */
    const { count, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true }) // Only get count, not data
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (countError) {
      console.error('Error counting unread notifications:', countError);
      // Continue despite error - the unread count is helpful but not critical
    }

    // Log success for monitoring and debugging purposes
    console.log(`Found ${notifications?.length || 0} notifications for user ${userId}, with ${count || 0} unread`);

    /**
     * Return a structured response with:
     * - The notifications array (or empty array if none found)
     * - Count of unread notifications for badge display
     * - Total number of notifications in this page for pagination
     */
    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: count || 0,
      total: notifications?.length || 0
    });
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: `Failed to fetch notifications: ${(error as Error).message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH endpoint to mark notifications as read
 * 
 * Supports two modes of operation:
 * 1. Mark a specific notification as read (using id parameter)
 * 2. Mark all of a user's notifications as read (using all=true)
 * 
 * @param request - The incoming HTTP request with user authentication and notification data
 * @returns JSON response indicating success or error information
 */
export async function PATCH(request: NextRequest) {
  try {
    /**
     * Authentication check
     * Verify the user is authenticated via the x-user-id header
     * This ensures notifications can only be modified by their owner
     */
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Extract the request parameters from the JSON body
    const body = await request.json();
    
    /**
     * Handle two different update modes based on the request parameters
     * 1. Single notification update - when body.id is provided
     * 2. Bulk update of all notifications - when body.all is true
     */
    if (body.id) {
      /**
       * Mode 1: Mark a specific notification as read
       * - Requires the notification ID
       * - Verifies the user owns this notification via the user_id check
       */
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.id)          // Target the specific notification
        .eq('user_id', userId);     // Security check: ensure user owns this notification
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
      }
    } else if (body.all === true) {
      /**
       * Mode 2: Mark all of a user's unread notifications as read
       * - Only targets notifications that are currently unread
       * - Filters by user_id to ensure privacy
       */
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)      // Only update this user's notifications
        .eq('is_read', false);      // Only update notifications that are currently unread
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else {
      // Neither valid mode was specified in the request
      return NextResponse.json({ error: 'Invalid request. Specify "id" or "all: true"' }, { status: 400 });
    }
    
    // Return success response after successful update
    return NextResponse.json({ success: true });
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error('Error in PATCH notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}