'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar/Navbar'
import ChatInterface from '@/components/Chat/ChatInterface'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'

export default function ChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false)
  const [initialQuestion, setInitialQuestion] = useState<string | null>(null)
  
  // Function to create a direct callback for sending a question to the chat interface
  const sendQuestionToChat = useCallback((question: string) => {
    console.log('Chat page: manually sending question to ChatInterface:', question);
    // First set the state
    setInitialQuestion(question);
    
    // Also try to directly trigger the chat interface if it's already mounted
    try {
      // Create and dispatch a custom event that ChatInterface will listen for
      const event = new CustomEvent('send-chat-question', { 
        detail: { question }
      });
      window.dispatchEvent(event);
    } catch (e) {
      console.error('Error dispatching question event:', e);
    }
  }, []);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.push('/login')
      return
    }
    
    // Check if there's a pre-defined question from the AI Assistant widget
    if (typeof window !== 'undefined') {
      let foundQuestion = null;
      
      // Look for the question in URL parameter - simplest and most direct approach
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('question'); // Match the parameter name used in the widget
      
      if (queryParam) {
        foundQuestion = decodeURIComponent(queryParam);
        console.log('Chat page: Found question in URL parameter:', foundQuestion);
        // Clean up the URL without refreshing
        window.history.replaceState({}, '', '/chat');
        
        // Set the initialQuestion state immediately
        setInitialQuestion(foundQuestion);
      } 
      
      // Fallback to direct localStorage check
      if (!foundQuestion) {
        foundQuestion = localStorage.getItem('lastAiAssistantQuestion');
        if (foundQuestion) {
          console.log('Chat page: Found question in localStorage:', foundQuestion);
          localStorage.removeItem('lastAiAssistantQuestion');
          setInitialQuestion(foundQuestion);
        }
      }
      
      // Send the question to the chat interface
      if (foundQuestion) {
        console.log('Chat page: Sending question to chat interface:', foundQuestion);
        // Wait a moment for components to initialize
        setTimeout(() => {
          sendQuestionToChat(foundQuestion);
        }, 500);
      }
    }
    
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
  }, [sendQuestionToChat, user, authLoading, router]);
  
  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }
  
  // If not authenticated, show a message and redirect
  if (!user) {
    // Force immediate redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <LoadingSpinner size="large" />
        <p className="mt-4">Please log in to access the chat...</p>
      </div>
    )
  }
  
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
              className="api-key-dismiss"
            >
              Dismiss this message
            </button>
          </div>
        )}
        
        <div className="chat-container-wrapper">
          <div className="chat-welcome-section">
            <div>
              <h1 className="chat-welcome-text">Academic AI Assistant</h1>
              <p className="chat-welcome-description">Ask me anything about your courses, assignments, or academic topics</p>
            </div>
            <div className="course-tag">
              Powered by AI
            </div>
          </div>
          
          <div className="chat-shortcut-section">
            <ChatInterface initialQuestion={initialQuestion} />
          </div>
        </div>
      </main>
    </div>
  )
}