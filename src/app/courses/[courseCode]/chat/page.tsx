'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import ChatInterface from '@/components/Chat/ChatInterface'
import { supabase } from '@/lib/supabase'

export default function CourseChatPage() {
  const params = useParams()
  const router = useRouter()
  const courseCode = typeof params?.courseCode === 'string' ? params.courseCode : '';
  const [courseName, setCourseName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false)
  
  // Log course code for debugging
  useEffect(() => {
    if (!courseCode) {
      console.error('Course code is missing from URL params');
    } else {
      console.log('Course code from URL:', courseCode);
    }
  }, [courseCode]);
  
  useEffect(() => {
    // Check if there's no valid API key
    const checkApiKeySetup = async () => {
      try {
        const response = await fetch('/api/chat/check-api-key');
        const { valid } = await response.json();
        setShowApiKeyInfo(!valid);
      } catch {
        // If there's an error, assume we need to show the API key info
        setShowApiKeyInfo(true);
      }
    };
    
    checkApiKeySetup();
  }, []);
  
  useEffect(() => {
    // Try to get course description from session storage first
    if (typeof window !== 'undefined') {
      const storedCourseName = sessionStorage.getItem('courseName');
      if (storedCourseName) {
        setCourseName(storedCourseName);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setIsLoading(true)
        
        // First check if we already have the course name in session storage
        // If we do, use it and skip the database query
        if (typeof window !== 'undefined') {
          const storedCourseName = sessionStorage.getItem('courseName');
          if (storedCourseName) {
            setCourseName(storedCourseName);
            setIsLoading(false);
            return; // Skip database query if we already have the name
          }
        }
        
        if (!supabase) {
          console.error('Supabase client not initialized');
          setError('Database connection error');
          setIsLoading(false);
          return;
        }
        
        // Check if Supabase URL and key are set
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Supabase environment variables not set');
          setError('Database configuration error');
          setIsLoading(false);
          return;
        }
        
        // Try to get the course from Supabase
        let response;
        try {
          response = await supabase
            .from('courses')
            .select('course_name')
            .eq('course_code', courseCode)
            .single();
        } catch (dbError) {
          console.error('Supabase connection error:', dbError);
          throw new Error('Database connection failed');
        }
        
        // Check for errors in the response
        if (response.error) {
          console.error('Supabase query error:', JSON.stringify(response.error));
          
          if (response.error.code === '42501') {
            console.error('Permission denied for courses table - check Supabase RLS policies');
            setError('Permission denied for database access');
          } else if (response.error.code === 'PGRST116') {
            setError('Course not found');
          } else if (response.error.code === 'PGRST301') {
            setError('Database connection error');
          } else {
            setError(`Database error: ${response.error.message || 'Unknown error'}`);
          }
          
          // Still try to use the course name from URL
          setCourseName(courseCode.toUpperCase().replace('-', ' '));
          
          setIsLoading(false);
          return;
        }
        
        if (response.data) {
          setCourseName(response.data.course_name);
          
          // Store in session storage for future reference
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('courseName', response.data.course_name);
          }
        } else {
          setError('Course not found');
          // Try to use the course code as a fallback
          setCourseName(courseCode.toUpperCase().replace('-', ' '));
        }
      } catch (err) {
        console.error('Error fetching course:', err instanceof Error ? err.message : 'Unknown error');
        
        // Try to use stored course name first
        let nameFallbackFound = false;
        if (typeof window !== 'undefined') {
          const storedCourseName = sessionStorage.getItem('courseName');
          if (storedCourseName) {
            setCourseName(storedCourseName);
            nameFallbackFound = true;
          }
        }
        
        // If no stored name, use course code
        if (!nameFallbackFound && courseCode) {
          setCourseName(courseCode.toUpperCase().replace('-', ' '));
        }
        
        // Only set an error message if debugging is needed
        setError(null); // We'll continue with the fallback name instead of showing an error
      } finally {
        setIsLoading(false);
      }
    }
    
    if (courseCode) {
      fetchCourseDetails();
    } else {
      setError('Invalid course code');
      setIsLoading(false);
    }
  }, [courseCode, courseName]);
  
  // Handle back navigation
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/courses');
    }
  };
  
  return (
    <div className="home-container">
      <Navbar />
      <main className="main-content">
        {showApiKeyInfo && (
          <div className="api-key-info">
            <h2 className="api-key-title">API Key Setup Required</h2>
            <p className="api-key-text">
              To use the AI Chat feature, you need to add your own OpenAI API key to the project. Follow these steps:
            </p>
            <ol className="api-key-list">
              <li>Sign up for an account on <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="api-key-link">OpenAI.com</a></li>
              <li>Generate an API key in your OpenAI dashboard</li>
              <li>Edit your <code className="api-key-code">.env.local</code> file at the project root</li>
              <li>Update the <code className="api-key-code">OPENAI_API_KEY=</code> line with your API key</li>
              <li>Restart the development server</li>
            </ol>
            <button 
              onClick={() => setShowApiKeyInfo(false)}
              className="api-key-dismiss bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:transform hover:scale-[1.02] shadow-md hover:shadow-lg"
            >
              Dismiss this message
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="loading-container h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-800/50">
            <div className="text-center py-4 text-red-400">{error}</div>
            <div className="text-center mt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 hover:transform hover:scale-[1.02] shadow-md hover:shadow-lg"
              >
                Back to Courses
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="chat-welcome-section">
              <h1 className="chat-welcome-text">Chat Assistant</h1>
              <div className="course-tag">
                {courseName}
              </div>
            </div>
            
            <div className="chat-shortcut-section flex flex-col">
              <div className="flex-1">
                <ChatInterface contextType="course" courseName={courseName} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
} 