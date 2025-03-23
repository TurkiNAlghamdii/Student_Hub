'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ChatBubbleLeftRightIcon, ArrowRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import './AIAssistantWidget.css'

interface Course {
  course_code: string
  course_name: string
  course_description: string
}

export default function AIAssistantWidget() {
  const router = useRouter()
  const { user } = useAuth()
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Use ref to store the current set of questions
  const questionsRef = useRef<string[]>([])
  
  // Generate questions based on enrolled courses
  const generateCourseQuestions = () => {
    if (courses.length === 0) {
      return [
        "How do I register for classes?",
        "What study techniques are most effective?",
        "Explain a difficult concept in simple terms",
        "Help me create a study schedule"
      ]
    }
    
    // Define multiple question templates for each course
    const questionTemplates = [
      (course: Course) => `What are the key topics in ${course.course_name} (${course.course_code})?`,
      (course: Course) => `Can you explain the main concepts of ${course.course_name}?`,
      (course: Course) => `What should I focus on when studying ${course.course_code}?`,
      (course: Course) => `Help me understand difficult concepts in ${course.course_name}`,
      (course: Course) => `What are the prerequisites for ${course.course_code}?`,
      (course: Course) => `What career paths relate to ${course.course_name}?`
    ]
    
    // Generate course-specific questions with random templates
    const courseQuestions = courses.slice(0, 4).map(course => {
      // Select a random template for each course
      const randomIndex = Math.floor(Math.random() * questionTemplates.length)
      return questionTemplates[randomIndex](course)
    })
    
    // If less than 4 courses, add some general questions
    const generalQuestions = [
      "How do I prepare for exams effectively?",
      "Help me create a study schedule",
      "What are good note-taking techniques?",
      "How can I improve my academic performance?",
      "How do I manage my time better?",
      "What are effective ways to collaborate with classmates?",
      "How can I reduce stress during exam periods?",
      "What tools can help my productivity as a student?"
    ]
    
    // Shuffle general questions to add variety
    const shuffledGeneralQuestions = [...generalQuestions]
      .sort(() => Math.random() - 0.5)
    
    // Combine course-specific and general questions to ensure we have at least 4
    return courseQuestions.concat(shuffledGeneralQuestions).slice(0, 4)
  }
  
  // Fetch enrolled courses and initialize questions
  useEffect(() => {
    if (!user) return

    const fetchUserCourses = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/user/courses', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (!response.ok) {
          console.error('Error fetching courses')
          setLoading(false)
          return
        }
        
        const data = await response.json()

        if (data.courses) {
          setCourses(data.courses)
        } else {
          setCourses([])
        }
      } catch (error) {
        console.error('An error occurred while fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserCourses()
  }, [user])
  
  // Initialize questions once when courses are loaded
  useEffect(() => {
    if (!loading && courses.length > 0 && questionsRef.current.length === 0) {
      questionsRef.current = generateCourseQuestions();
    }
  }, [courses, loading]);
  
  // Update questions ONLY when forceUpdate changes (refresh button clicked)
  useEffect(() => {
    if (forceUpdate > 0) { // Skip initial render
      questionsRef.current = generateCourseQuestions();
    }
  }, [forceUpdate]);
  
  // Handle refreshing questions
  const handleRefreshQuestions = () => {
    setForceUpdate(prev => prev + 1)
  }
  
  // Handle click on a quick question
  const handleQuickQuestionClick = (question: string) => {
    try {
      // Log for debugging
      console.log('AI Widget: Question selected:', question);
      
      // Simple approach - use direct query parameter and let the router handle this more reliably
      // This will ensure the question is in the URL and can be read directly by the chat page
      router.push(`/chat?question=${encodeURIComponent(question)}`);
      
      // Add a backup to local storage with a clear name
      localStorage.setItem('lastAiAssistantQuestion', question);
    } catch (error) {
      console.error('Error in AI widget when setting question:', error);
      // Fallback with simpler approach
      router.push('/chat');
    }
  }
  
  return (
    <div className="ai-assistant-widget">
      <div className="widget-header">
        <div className="widget-title-container">
          <ChatBubbleLeftRightIcon className="widget-icon" />
          <h3 className="widget-title">AI Assistant</h3>
        </div>
        <div className="widget-actions">
          <button
            className="refresh-button"
            onClick={handleRefreshQuestions}
            title="Get new questions"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            className="chat-button"
            onClick={() => router.push('/chat')}
            onMouseEnter={() => setIsChatButtonHovered(true)}
            onMouseLeave={() => setIsChatButtonHovered(false)}
          >
            <span>Chat Now</span>
            <ArrowRightIcon 
              className={`h-4 w-4 ml-1 transition-transform duration-300 ${isChatButtonHovered ? 'translate-x-1' : ''}`} 
            />
          </button>
        </div>
      </div>
      
      <div className="widget-content">
        <p className="widget-description">
          Get instant help with your academic questions
        </p>
        
        <div className="quick-questions">
          <h4 className="quick-questions-title">Quick Questions</h4>
          <div className="quick-questions-list">
            {loading ? (
              <p className="text-gray-400 text-sm">Loading your course questions...</p>
            ) : (
              questionsRef.current.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-item"
                  onClick={() => handleQuickQuestionClick(question)}
                >
                  <div className="quick-question-content">{question}</div>
                  <ArrowRightIcon className="quick-question-arrow" />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 