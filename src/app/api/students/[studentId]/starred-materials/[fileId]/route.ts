import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// Helper to validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// POST /api/students/[studentId]/starred-materials/[fileId]
// Toggle starred status of a file for a student
export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string; fileId: string } }
) {
  // Await the params object to ensure it's resolved
  const { studentId, fileId } = await Promise.resolve(params);
  const authHeader = request.headers.get('x-user-id');
  
  // Validate the request
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized - Missing auth header' }, { status: 401 });
  }
  
  // Only allow students to star their own materials
  if (authHeader !== studentId) {
    return NextResponse.json({ error: 'Forbidden - Cannot star materials for another student' }, { status: 403 });
  }
  
  // Validate UUID format
  if (!isValidUUID(studentId) || !isValidUUID(fileId)) {
    return NextResponse.json({ 
      error: 'Invalid ID format', 
      details: 'Student ID and File ID must be valid UUIDs',
      studentId,
      fileId
    }, { status: 400 });
  }
  
  try {
    // Check if the material is already starred
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('student_starred_materials')
      .select('id')
      .eq('student_id', studentId)
      .eq('file_id', fileId)
      .maybeSingle();
    
    if (checkError) {
      return NextResponse.json({ 
        error: 'Failed to check if material is starred', 
        details: checkError.message,
        code: checkError.code
      }, { status: 500 });
    }
    
    let result;
    
    // If already starred, remove the star
    if (existingData) {
      const { error: deleteError } = await supabaseAdmin
        .from('student_starred_materials')
        .delete()
        .eq('student_id', studentId)
        .eq('file_id', fileId);
      
      if (deleteError) {
        return NextResponse.json({ 
          error: 'Failed to remove star from material', 
          details: deleteError.message,
          code: deleteError.code 
        }, { status: 500 });
      }
      
      result = { status: 'unstarred', file_id: fileId };
    } 
    // Otherwise, add the star
    else {
      // First, do a more direct check to see if student and file IDs exist
      const { count: studentCount, error: studentCountError } = await supabaseAdmin
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('id', studentId);
      
      if (studentCountError) {
        return NextResponse.json({ 
          error: 'Failed to verify student ID', 
          details: studentCountError.message 
        }, { status: 500 });
      }
      
      if (studentCount === 0) {
        return NextResponse.json({ 
          error: 'Student not found', 
          details: `No student with ID ${studentId}` 
        }, { status: 404 });
      }
      
      const { count: fileCount, error: fileCountError } = await supabaseAdmin
        .from('course_files')
        .select('*', { count: 'exact', head: true })
        .eq('id', fileId);
      
      if (fileCountError) {
        return NextResponse.json({ 
          error: 'Failed to verify file ID', 
          details: fileCountError.message 
        }, { status: 500 });
      }
      
      if (fileCount === 0) {
        return NextResponse.json({ 
          error: 'File not found', 
          details: `No file with ID ${fileId}` 
        }, { status: 404 });
      }
      
      // Try the insertion
      const { error: insertError } = await supabaseAdmin
        .from('student_starred_materials')
        .insert({
          student_id: studentId,
          file_id: fileId
        });
      
      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to star material', 
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint || 'No hint available'
        }, { status: 500 });
      }
      
      result = { status: 'starred', file_id: fileId };
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 