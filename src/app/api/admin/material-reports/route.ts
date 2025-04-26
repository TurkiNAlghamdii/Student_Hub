/**
 * Admin Material Reports API Route
 * 
 * This API provides administrative functionality for managing reported course materials, including:
 * - Retrieving all material reports with filtering options
 * - Processing reports by reviewing (removing material) or dismissing them
 * 
 * These endpoints are intended for admin use only and should be protected
 * by appropriate authorization checks in the frontend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PUT endpoint to process a material report
 * 
 * Handles two actions for reported materials:
 * 1. 'reviewed' - Removes the reported material and marks the report as processed
 * 2. 'dismissed' - Keeps the material but marks the report as processed
 * 
 * @param request - The incoming HTTP request with reportId and action
 * @returns JSON response indicating success or error information
 */
export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }
    
    /**
     * Extract and validate request parameters
     * The request must include a reportId and a valid action
     */
    const data = await request.json();
    const { reportId, action } = data;
    
    // Ensure both required fields are provided
    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId and action' },
        { status: 400 }
      );
    }
    
    // Validate that the action is one of the allowed values
    if (action !== 'reviewed' && action !== 'dismissed') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "reviewed" or "dismissed"' },
        { status: 400 }
      );
    }
    
    /**
     * Fetch the report details to get the associated material_id
     * This is needed to identify which material needs to be removed if action is 'reviewed'
     */
    const { data: reportData, error: fetchError } = await supabaseAdmin
      .from('material_reports')
      .select('id, material_id')
      .eq('id', reportId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching report:', fetchError);
      return NextResponse.json(
        { error: `Failed to fetch report: ${fetchError.message}` },
        { status: 500 }
      );
    }
    
    // Ensure the report exists
    if (!reportData) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    /**
     * Handle material removal for 'reviewed' action
     * If the admin confirms the report is valid (action='reviewed'),
     * the reported material is removed from the database
     */
    if (action === 'reviewed') {
      const { error: deleteError } = await supabaseAdmin
        .from('course_files')
        .delete()
        .eq('id', reportData.material_id);
      
      if (deleteError) {
        console.error('Error deleting material:', deleteError);
        return NextResponse.json(
          { error: `Failed to delete material: ${deleteError.message}` },
          { status: 500 }
        );
      }
    }
    
    /**
     * Update the report status to reflect the admin's decision
     * This marks the report as processed and records when it was handled
     */
    const { error: updateError } = await supabaseAdmin
      .from('material_reports')
      .update({
        status: action,                  // Either 'reviewed' or 'dismissed'
        updated_at: new Date().toISOString() // Timestamp of when the report was processed
      })
      .eq('id', reportId);
    
    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: `Failed to update report: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    // Return a success response with an appropriate message based on the action taken
    return NextResponse.json({
      success: true,
      message: action === 'reviewed' ? 'Material removed and report processed' : 'Report dismissed successfully'
    });
    
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error('Error processing material report:', error);
    return NextResponse.json(
      { error: 'Failed to process material report' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch material reports
 * 
 * Retrieves material reports with optional filtering by status.
 * Includes detailed information about the reported material, the reporter,
 * and the uploader of the material.
 * 
 * @param request - The incoming HTTP request with optional status filter
 * @returns JSON response with an array of material report objects
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }
    
    /**
     * Extract query parameters for filtering
     * The 'status' parameter can be used to filter reports by their current status
     */
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    console.log('Fetching material reports with status:', status);
    
    /**
     * Build a query to fetch material reports with related data
     * This uses Supabase's foreign key relationships to join data from multiple tables:
     * - material_reports: The main report data
     * - students: Information about the reporter
     * - course_files: Details about the reported material
     */
    let query = supabaseAdmin
      .from('material_reports')
      .select(`
        id,
        material_id,
        reason,
        details,
        status,
        created_at,
        updated_at,
        reporter_id,
        reporter:students!reporter_id(full_name, email, student_id),
        material:course_files!material_id(
          file_name,
          file_type,
          file_url,
          file_size,
          description,
          uploaded_at,
          course_code,
          user_id
        )
      `)
      .order('created_at', { ascending: false }); // Newest reports first
    
    /**
     * Apply status filtering based on the query parameter
     * - 'pending': Show only unprocessed reports
     * - 'reviewed': Show processed reports (both reviewed and dismissed)
     */
    if (status === 'pending') {
      query = query.eq('status', 'pending');
    } else if (status === 'reviewed') {
      // Use OR condition to include both reviewed and dismissed reports
      query = query.or('status.eq.reviewed,status.eq.dismissed');
    }
    
    // Execute the query to fetch the reports
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching material reports:', error);
      return NextResponse.json(
        { error: `Failed to fetch reports: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} material reports`);
    
    /**
     * Enhance report data with information about material uploaders
     * This adds user_info to each material to show who uploaded the reported content
     */
    if (data && data.length > 0) {
      // Extract all unique user IDs of material uploaders
      const userIds = [...new Set(data.map((report: any) => report.material?.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        console.log(`Fetching user data for ${userIds.length} users`);
        
        /**
         * Fetch user data for all uploaders in a single efficient query
         * This is more performant than making separate queries for each uploader
         */
        const { data: userData, error: userError } = await supabaseAdmin
          .from('students')
          .select('id, full_name, email, student_id')
          .in('id', userIds);
          
        if (userError) {
          console.error('Error fetching user data:', userError);
          return NextResponse.json(
            { error: `Failed to fetch user data: ${userError.message}` },
            { status: 500 }
          );
        }
        
        /**
         * Create a lookup map for efficient user data access
         * This allows O(1) access to user information when processing reports
         */
        const userMap = (userData || []).reduce((map: any, user: any) => {
          map[user.id] = { 
            full_name: user.full_name, 
            email: user.email,
            student_id: user.student_id 
          };
          return map;
        }, {});
        
        /**
         * Add uploader information to each material in the reports
         * This enriches the data for the admin UI to show who uploaded each reported item
         */
        data.forEach((report: any) => {
          if (report.material && report.material.user_id) {
            report.material.user_info = userMap[report.material.user_id] || 
              { full_name: 'Unknown', email: 'unknown', student_id: 'unknown' };
          }
        });
      }
    }
    
    // Return the enhanced reports data in a structured response
    return NextResponse.json({ reports: data || [] });
    
  } catch (error) {
    // Global error handler for unexpected exceptions
    console.error('Error fetching material reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material reports' },
      { status: 500 }
    );
  }
}