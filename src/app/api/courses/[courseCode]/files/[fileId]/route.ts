import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DELETE to remove a file
export async function DELETE(
  request: NextRequest, 
  { params }: { params: { courseCode: string; fileId: string } }
) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const { courseCode, fileId } = resolvedParams;
    
    if (!courseCode || !fileId) {
      return NextResponse.json({ error: 'Course code and file ID are required' }, { status: 400 });
    }
    
    // Check if the user is authenticated
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Get the file record to check ownership and get file path
    const { data: file, error: fileError } = await supabaseAdmin
      .from('course_files')
      .select('*')
      .eq('id', fileId)
      .eq('course_code', courseCode)
      .single();
    
    if (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Check if the user owns the file
    if (file.user_id !== userId) {
      return NextResponse.json({ error: 'You do not have permission to delete this file' }, { status: 403 });
    }
    
    // Extract the path from the file URL
    const urlParts = file.file_url.split('/');
    const filePath = `${courseCode}/${urlParts[urlParts.length - 1]}`;
    
    // Delete the file from storage
    const { error: storageError } = await supabaseAdmin
      .storage
      .from('course-files')
      .remove([filePath]);
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete the file record from the database
    const { error: deleteError } = await supabaseAdmin
      .from('course_files')
      .delete()
      .eq('id', fileId);
    
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 