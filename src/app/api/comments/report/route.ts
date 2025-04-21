import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { commentId, reason, details } = await request.json()

    // Validate required parameters
    if (!commentId || !reason) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get the authenticated user - try both methods:
    // 1. First try header authentication
    const userId = request.headers.get('x-user-id') || null;
    
    // 2. If header auth fails, try cookie authentication
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

    // Check if user has already reported this comment
    const { data: existingReport, error: checkError } = await (supabaseAdmin || supabase)
      .from('comment_reports')
      .select('id')
      .eq('comment_id', commentId)
      .eq('reporter_id', authenticatedUserId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking existing report:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing reports' },
        { status: 500 }
      )
    }

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this comment' },
        { status: 400 }
      )
    }

    // First, verify the comment exists
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

    // Create the report
    const { data, error } = await (supabaseAdmin || supabase)
      .from('comment_reports')
      .insert({
        comment_id: commentId,
        reporter_id: authenticatedUserId,
        reason,
        details: details || null,
        status: 'pending'
      })
      .select()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Comment reported successfully',
      report: data
    })
  } catch (error) {
    console.error('Error in report comment API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 