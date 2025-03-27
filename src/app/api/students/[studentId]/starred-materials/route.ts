import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/students/[studentId]/starred-materials
// Get all starred materials for a student
export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  // Await the params object to ensure it's resolved
  const { studentId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Validate the request
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if the requesting user is the student or an admin
  if (authHeader !== studentId) {
    // Check if the user is an admin
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const isAdmin = userData.user?.app_metadata?.is_admin;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  try {
    // Get all starred materials for this student
    const { data, error } = await supabaseAdmin
      .from('student_starred_materials')
      .select('file_id, starred_at, course_files(*)')
      .eq('student_id', studentId)
      .order('starred_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch starred materials' }, { status: 500 });
    }
    
    return NextResponse.json({ starred_materials: data || [] });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Get starred file IDs only (lightweight version of the GET endpoint)
export async function HEAD(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  // Await the params object to ensure it's resolved
  const { studentId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Validate the request
  if (!authHeader) {
    return new NextResponse(null, { status: 401 });
  }
  
  // Check if the requesting user is the student or an admin
  if (authHeader !== studentId) {
    // Check if the user is an admin
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader);
    
    if (userError || !userData) {
      return new NextResponse(null, { status: 401 });
    }
    
    const isAdmin = userData.user?.app_metadata?.is_admin;
    if (!isAdmin) {
      return new NextResponse(null, { status: 403 });
    }
  }
  
  try {
    // Get only file IDs of starred materials for this student
    const { data, error } = await supabaseAdmin
      .from('student_starred_materials')
      .select('file_id')
      .eq('student_id', studentId);
    
    if (error) {
      return new NextResponse(null, { status: 500 });
    }
    
    // Convert data to array of IDs and set as a header
    const fileIds = data.map(item => item.file_id);
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'X-Starred-Files': JSON.stringify(fileIds)
      }
    });
    
  } catch (error: any) {
    return new NextResponse(null, { status: 500 });
  }
} 