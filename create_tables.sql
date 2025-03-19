-- Create course_files table
CREATE TABLE IF NOT EXISTS public.course_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  course_code text NOT NULL,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  description text,
  uploaded_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT valid_file_size CHECK (file_size > 0 and file_size <= 10485760),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (course_code) REFERENCES public.courses(course_code)
);

-- Set up RLS policies for the course_files table
ALTER TABLE public.course_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view course files"
  ON public.course_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own course files"
  ON public.course_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own course files"
  ON public.course_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own course files"
  ON public.course_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for course files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Authenticated users can upload course files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'course-files');

CREATE POLICY "Users can view course files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'course-files');

CREATE POLICY "Users can update their own course files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'course-files' AND auth.uid() = owner::uuid);

CREATE POLICY "Users can delete their own course files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'course-files' AND auth.uid() = owner::uuid); 