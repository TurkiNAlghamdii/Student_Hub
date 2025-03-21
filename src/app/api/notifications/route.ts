import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET to fetch user's notifications
export async function GET(request: Request) {
  try {
    // Extract the user ID from the request header
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      console.log('No user ID provided in request headers');
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    console.log(`Fetching notifications for user: ${userId}`);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Fetch notifications
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

    // Count unread notifications
    const { count, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (countError) {
      console.error('Error counting unread notifications:', countError);
    }

    // Log success
    console.log(`Found ${notifications?.length || 0} notifications for user ${userId}, with ${count || 0} unread`);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: count || 0,
      total: notifications?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error in notifications API:', error);
    return NextResponse.json(
      { error: `Failed to fetch notifications: ${(error as Error).message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

// PATCH to mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    // Check if the user is authenticated
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if we're marking a specific notification as read or all notifications
    if (body.id) {
      // Mark specific notification as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', body.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
      }
    } else if (body.all === true) {
      // Mark all notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error marking all notifications as read:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid request. Specify "id" or "all: true"' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 