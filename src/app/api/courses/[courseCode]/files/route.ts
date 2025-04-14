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
    
    // Get user data to check for admin status
    const { data: userData, error: userError } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      // Continue without admin privileges if user data fetch fails
    }
    
    // Check if the course exists
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('course_code', courseCode)
      .single();
      
    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
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
        // Create a Set of unique user IDs to fetch
        const userIds = new Set(files.map(file => file.user_id));
        
        // Fetch all user details in one query
        const { data: allUserData, error: allUserError } = await supabaseAdmin
          .from('students')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(userIds));
          
        if (allUserError) {
          console.error('Error fetching all user data:', allUserError);
        }
        
        // Create a map of user id to user data for quick lookup
        const userMap: Record<string, { id: string; full_name?: string; avatar_url?: string }> = {};
        if (allUserData) {
          allUserData.forEach(user => {
            userMap[user.id] = user;
          });
        }
        
        // Add user_info to each file
        const filesWithUserInfo = files.map(file => {
          const user = userMap[file.user_id];
          
          if (!user) {
            return {
              ...file,
              user_info: {
                full_name: 'Unknown User',
                avatar_url: null
              }
            };
          }
          
          return {
            ...file,
            user_info: {
              full_name: user.full_name || 'Unknown User',
              avatar_url: user.avatar_url || null
            }
          };
        });
        
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
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
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
    
    // Get uploader's information for notification
    const { data: uploaderData } = await supabaseAdmin
      .from('students')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    const uploaderName = uploaderData?.full_name || 'A student';
    
    // Insert the file record into the database
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('course_files')
      .insert([{
        course_code: courseCode,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        description: description || null,
        user_id: userId
      }])
      .select()
      .single();
    
    if (fileError) {
      // Clean up storage if database insert fails
      await supabaseAdmin
        .storage
        .from('course-files')
        .remove([filePath]);
        
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }
    
    // Find all students who have this course in their list
    const { data: studentsWithCourse, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, courses')
      .contains('courses', [courseCode]);
    
    if (!studentsError && studentsWithCourse && studentsWithCourse.length > 0) {
      // Prepare notifications for all students who have this course except the uploader
      const notifications = studentsWithCourse
        .filter(student => student.id !== userId) // Exclude the uploader
        .map(student => ({
          user_id: student.id,
          type: 'file_upload',
          title: `New file in ${courseData.course_code}`,
          message: `${uploaderName} uploaded "${file.name}" to ${courseData.course_name}`,
          link: `/courses/${courseCode}`,
          related_id: fileData.id,
          is_read: false
        }));
      
      // Insert notifications if there are any recipients
      if (notifications.length > 0) {
        await supabaseAdmin
          .from('notifications')
          .insert(notifications);
      }
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