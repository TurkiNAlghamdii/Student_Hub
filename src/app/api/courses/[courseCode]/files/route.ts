import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to validate file type
const isValidFileType = (fileType: string) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-rar-compressed',
  ];
  
  return allowedTypes.includes(fileType);
};

// GET all files for a course
export async function GET(request: NextRequest, { params }: { params: { courseCode: string } }) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const courseCode = resolvedParams.courseCode;
    
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    
    // Check if the user is authenticated
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Check if the course exists
    try {
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('course_code')
        .eq('course_code', courseCode)
        .single();
        
      if (courseError) {
        return NextResponse.json({ error: `Course not found: ${courseError.message}` }, { status: 404 });
      }
    } catch (error) {
      return NextResponse.json({ error: `Error checking course: ${(error as Error).message}` }, { status: 500 });
    }
    
    // Check if the course_files table exists
    try {
      // Get all files for the course
      const { data: files, error: filesError } = await supabaseAdmin
        .from('course_files')
        .select(`
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          description,
          uploaded_at,
          user_id
        `)
        .eq('course_code', courseCode)
        .order('uploaded_at', { ascending: false });
      
      if (filesError) {
        return NextResponse.json({ error: `Error fetching files: ${filesError.message}` }, { status: 500 });
      }
      
      // For each file, get the user details separately
      if (files && files.length > 0) {
        const filesWithUserInfo = await Promise.all(
          files.map(async (file) => {
            try {
              const { data: userData, error: userError } = await supabaseAdmin
                .from('students')
                .select('id, first_name, last_name')
                .eq('id', file.user_id)
                .single();
                
              if (userError || !userData) {
                return {
                  ...file,
                  user_info: {
                    first_name: 'Unknown',
                    last_name: 'User'
                  }
                };
              }
              
              return {
                ...file,
                user_info: {
                  first_name: userData.first_name,
                  last_name: userData.last_name
                }
              };
            } catch (error) {
              return {
                ...file,
                user_info: {
                  first_name: 'Unknown',
                  last_name: 'User'
                }
              };
            }
          })
        );
        
        return NextResponse.json({ files: filesWithUserInfo });
      }
      
      return NextResponse.json({ files: files || [] });
    } catch (error) {
      console.error('Unexpected error in GET files:', error);
      return NextResponse.json({ 
        error: `Internal server error: ${(error as Error).message}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET files:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${(error as Error).message}`
    }, { status: 500 });
  }
}

// POST to upload a new file
export async function POST(request: NextRequest, { params }: { params: { courseCode: string } }) {
  try {
    // Await params before accessing its properties
    const resolvedParams = await Promise.resolve(params);
    const courseCode = resolvedParams.courseCode;
    
    if (!courseCode) {
      return NextResponse.json({ error: 'Course code is required' }, { status: 400 });
    }
    
    // Check if the user is authenticated
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }
    
    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    
    // Check if the course exists
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('course_code')
      .eq('course_code', courseCode)
      .single();
      
    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Generate a unique file name to avoid collisions
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = `${courseCode}/${uniqueFileName}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('course-files')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
    }
    
    // Get the public URL of the file
    const { data } = supabaseAdmin
      .storage
      .from('course-files')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    // Insert the file record into the database
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('course_files')
      .insert({
        user_id: userId,
        course_code: courseCode,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        description: description || null,
      })
      .select()
      .single();
    
    if (fileError) {
      // Clean up storage if database insert fails
      await supabaseAdmin
        .storage
        .from('course-files')
        .remove([filePath]);
        
      return NextResponse.json({ error: `Failed to save file record: ${fileError.message}` }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      file: fileData
    });
  } catch (error) {
    console.error('Error in POST file upload:', error);
    return NextResponse.json({ error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
  }
} 