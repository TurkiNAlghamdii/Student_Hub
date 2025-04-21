import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }
    
    // Get data from request
    const data = await request.json();
    const { reportId, action } = data;
    
    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId and action' },
        { status: 400 }
      );
    }
    
    if (action !== 'reviewed' && action !== 'dismissed') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "reviewed" or "dismissed"' },
        { status: 400 }
      );
    }
    
    // Get the report to obtain material_id
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
    
    if (!reportData) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // If action is "reviewed", delete the material
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
    
    // Update report status
    const { error: updateError } = await supabaseAdmin
      .from('material_reports')
      .update({
        status: action,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json(
        { error: `Failed to update report: ${updateError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: action === 'reviewed' ? 'Material removed and report processed' : 'Report dismissed successfully'
    });
    
  } catch (error) {
    console.error('Error processing material report:', error);
    return NextResponse.json(
      { error: 'Failed to process material report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database client not initialized' },
        { status: 500 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    
    console.log('Fetching material reports with status:', status);
    
    // Build the query
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
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status === 'pending') {
      query = query.eq('status', 'pending');
    } else if (status === 'reviewed') {
      query = query.or('status.eq.reviewed,status.eq.dismissed');
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching material reports:', error);
      return NextResponse.json(
        { error: `Failed to fetch reports: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Found ${data?.length || 0} material reports`);
    
    // Process the data to add uploader info for each material
    if (data && data.length > 0) {
      // Extract all unique user_ids
      const userIds = [...new Set(data.map((report: any) => report.material?.user_id).filter(Boolean))];
      
      if (userIds.length > 0) {
        console.log(`Fetching user data for ${userIds.length} users`);
        
        // Fetch all users in a single query with more details
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
        
        // Create a map of user data for quick lookup
        const userMap = (userData || []).reduce((map: any, user: any) => {
          map[user.id] = { 
            full_name: user.full_name, 
            email: user.email,
            student_id: user.student_id 
          };
          return map;
        }, {});
        
        // Add user_info to each report
        data.forEach((report: any) => {
          if (report.material && report.material.user_id) {
            report.material.user_info = userMap[report.material.user_id] || 
              { full_name: 'Unknown', email: 'unknown', student_id: 'unknown' };
          }
        });
      }
    }
    
    return NextResponse.json({ reports: data || [] });
    
  } catch (error) {
    console.error('Error fetching material reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material reports' },
      { status: 500 }
    );
  }
} 