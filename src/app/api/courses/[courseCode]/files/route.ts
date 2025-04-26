/**
 * Course Files API Route
 * 
 * This API handles file operations for course materials, including:
 * - Retrieving all files for a specific course
 * - Uploading new files to a course
 * 
 * The API enforces authentication, file type validation, and size limits
 * while also managing related notifications for course participants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client
 * 
 * Uses the service role key to perform privileged operations like:
 * - Accessing user data across the platform
 * - Managing files in storage buckets
 * - Creating notifications for multiple users
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Helper function to validate file type
 * 
 * Ensures that only approved file types can be uploaded to the platform.
 * This is a security measure to prevent malicious file uploads and ensure
 * compatibility with the system's file viewer.
 * 
 * @param fileType - MIME type of the file to validate
 * @returns boolean indicating whether the file type is allowed
 */
const isValidFileType = (fileType: string) => {
  const allowedTypes = [
    // Document formats
    'application/pdf',                                                      // PDF
    'application/msword',                                                   // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel',                                             // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',    // XLSX
    'application/vnd.ms-powerpoint',                                        // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'text/plain',                                                           // TXT
    
    // Image formats
    'image/jpeg',                                                           // JPG/JPEG
    'image/png',                                                            // PNG
    'image/gif',                                                            // GIF
    
    // Archive formats
    'application/zip',                                                      // ZIP
    'application/x-rar-compressed',                                         // RAR
  ];
  
  return allowedTypes.includes(fileType);
};

/**
 * GET endpoint to retrieve all files for a specific course
 * 
 * Fetches all files associated with a course code and includes
 * information about the user who uploaded each file.
 * 
 * @param request - The incoming HTTP request with user authentication
 * @param params - Route parameters containing the course code
 * @returns JSON response with an array of course files and their metadata
 */
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
    
    /**
     * Fetch user data to check for admin status
     * This is used to determine if additional permissions should be granted,
     * though currently all authenticated users can view course files
     */
    const { data: userData, error: userError } = await supabaseAdmin
      .auth
      .admin
      .getUserById(userId);
      
    if (userError) {
      console.error('Error fetching user data:', userError);
      // Continue without admin privileges if user data fetch fails
      // This ensures the API remains functional even if admin checks fail
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
    
    /**
     * Fetch all files associated with this course
     * The files are ordered by upload date (newest first) to show
     * the most recent materials at the top of the list
     */
    try {
      // Query the course_files table for all files matching the course code
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
      
      /**
       * Enhance file data with uploader information
       * This adds the name and avatar of each file's uploader to provide
       * context about who shared each resource
       */
      if (files && files.length > 0) {
        // Optimize by fetching unique user data in a single query
        // First, extract all unique user IDs from the files
        const userIds = new Set(files.map(file => file.user_id));
        
        // Fetch user details for all uploaders in one efficient query
        const { data: allUserData, error: allUserError } = await supabaseAdmin
          .from('students')
          .select('id, full_name, avatar_url')
          .in('id', Array.from(userIds));
          
        if (allUserError) {
          console.error('Error fetching all user data:', allUserError);
          // Continue with partial data if user info fetch fails
        }
        
        /**
         * Create an efficient lookup map for user data
         * This allows O(1) access to user information when processing files
         */
        const userMap: Record<string, { id: string; full_name?: string; avatar_url?: string }> = {};
        if (allUserData) {
          allUserData.forEach(user => {
            userMap[user.id] = user;
          });
        }
        
        /**
         * Enrich each file with its uploader's information
         * This creates a complete data structure for the frontend to display
         * both file details and uploader information together
         */
        const filesWithUserInfo = files.map(file => {
          const user = userMap[file.user_id];
          
          // Handle the case where user data couldn't be found
          if (!user) {
            return {
              ...file,
              user_info: {
                full_name: 'Unknown User',
                avatar_url: null
              }
            };
          }
          
          // Add user information to the file object
          return {
            ...file,
            user_info: {
              full_name: user.full_name || 'Unknown User',
              avatar_url: user.avatar_url || null
            }
          };
        });
        
        // Return the enhanced file list with user information
        return NextResponse.json({ files: filesWithUserInfo });
      }
      
      // If no files were found, return an empty array
      return NextResponse.json({ files: files || [] });
    } catch (error) {
      // Handle errors during file data processing
      console.error('Unexpected error in GET files:', error);
      return NextResponse.json({ 
        error: `Internal server error: ${(error as Error).message}` 
      }, { status: 500 });
    }
  } catch (error) {
    // Global error handler for the entire GET endpoint
    console.error('Error in GET files:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${(error as Error).message}`
    }, { status: 500 });
  }
}

/**
 * POST endpoint to upload a new file to a course
 * 
 * Handles file uploads, validates file properties, stores the file in Supabase Storage,
 * creates a database record, and sends notifications to course participants.
 * 
 * @param request - The incoming HTTP request with file data and user authentication
 * @param params - Route parameters containing the course code
 * @returns JSON response with the uploaded file metadata or error information
 */
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
    
    /**
     * Extract and validate the uploaded file and its metadata
     * Performs several validation checks to ensure the file meets platform requirements
     */
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    
    // Ensure a file was actually provided
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    /**
     * File validation checks:
     * 1. Size limit (10MB) - prevents server overload and storage abuse
     * 2. File type - ensures only safe and supported file types are uploaded
     */
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }
    
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
    
    /**
     * Generate a unique file path for storage
     * This prevents filename collisions and organizes files by course
     * Format: courseCode/userId-timestamp.extension
     */
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = `${courseCode}/${uniqueFileName}`;
    
    /**
     * Upload the file to Supabase Storage
     * Stores the actual file content in the 'course-files' bucket
     * with appropriate content type and caching settings
     */
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('course-files')
      .upload(filePath, file, {
        contentType: file.type,    // Ensures correct MIME type is set
        cacheControl: '3600',      // 1-hour cache for better performance
        upsert: false              // Prevents overwriting existing files
      });
    
    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 });
    }
    
    /**
     * Generate a public access URL for the uploaded file
     * This URL will be stored in the database and used by the frontend
     * to provide direct access to the file for authorized users
     */
    const { data } = supabaseAdmin
      .storage
      .from('course-files')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    /**
     * Retrieve the uploader's name for notification purposes
     * This personalizes notifications by including who uploaded the file
     */
    const { data: uploaderData } = await supabaseAdmin
      .from('students')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    // Default to 'A student' if name can't be retrieved
    const uploaderName = uploaderData?.full_name || 'A student';
    
    /**
     * Create a database record for the uploaded file
     * This stores metadata about the file including its location,
     * properties, and the user who uploaded it
     */
    const { data: fileData, error: fileError } = await supabaseAdmin
      .from('course_files')
      .insert([{
        course_code: courseCode,          // Associate with the correct course
        file_name: file.name,             // Original filename for display
        file_size: file.size,             // File size in bytes
        file_type: file.type,             // MIME type for content handling
        file_url: publicUrl,              // URL for accessing the file
        description: description || null, // Optional description
        user_id: userId                   // ID of the uploading user
      }])
      .select()
      .single();
    
    if (fileError) {
      /**
       * Clean up the uploaded file if database record creation fails
       * This prevents orphaned files in storage that have no database reference
       */
      await supabaseAdmin
        .storage
        .from('course-files')
        .remove([filePath]);
        
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }
    
    /**
     * Create notifications for course participants
     * This alerts students enrolled in the course about the new material
     */
    const { data: studentsWithCourse, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, courses')
      .contains('courses', [courseCode]);
    
    if (!studentsError && studentsWithCourse && studentsWithCourse.length > 0) {
      /**
       * Generate notifications for all enrolled students except the uploader
       * The uploader doesn't need to be notified about their own upload
       */
      const notifications = studentsWithCourse
        .filter(student => student.id !== userId) // Exclude the uploader
        .map(student => ({
          user_id: student.id,                     // Recipient
          type: 'file_upload',                     // Notification type
          title: `New file in ${courseData.course_code}`,
          message: `${uploaderName} uploaded "${file.name}" to ${courseData.course_name}`,
          link: `/courses/${courseCode}`,          // Link to the course page
          related_id: fileData.id,                 // Reference to the file
          is_read: false                           // Initially unread
        }));
      
      // Only create notifications if there are recipients
      if (notifications.length > 0) {
        await supabaseAdmin
          .from('notifications')
          .insert(notifications);
      }
    }
    
    // Return success response with the file metadata
    return NextResponse.json({ 
      message: 'File uploaded successfully', 
      file: fileData
    });
  } catch (error) {
    // Global error handler for the entire POST endpoint
    console.error('Error in POST file upload:', error);
    return NextResponse.json({ error: `Internal server error: ${(error as Error).message}` }, { status: 500 });
  }
}