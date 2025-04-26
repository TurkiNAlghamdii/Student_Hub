'use client'

// Import necessary React hooks and components
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatBubbleLeftRightIcon, ArrowRightIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import './AIAssistantWidget.css'

// Define common prompt suggestions that students might find useful
// Each suggestion has text content and a category for styling purposes
// These are quick prompts users can click instead of typing
const PROMPT_SUGGESTIONS = [
  {
    text: "How do I improve my GPA?",
    category: "academic"  // Used for styling with different colors
  },
  {
    text: "Tips for exam preparation",
    category: "study"
  },
  {
    text: "Help me understand recursion",
    category: "cs"
  },
  {
    text: "Time management strategies",
    category: "productivity"
  }
]

export default function AIAssistantWidget() {
  const router = useRouter()
  // State to track hover state for button animation
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false)
  
  // Handle clicking on a prompt suggestion
  // This sends the user to the chat page with the selected question
  // NOTE: We had an issue where the query params weren't being processed correctly
  // Fixed by ensuring proper encoding of the URL parameter
  const handlePromptClick = (promptText: string) => {
    // Navigate to chat page with the selected prompt as a query parameter
    router.push(`/chat?question=${encodeURIComponent(promptText)}`)
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
        
        {/* Prompt suggestions section */}
        {/* This shows quick clickable prompts for common questions */}
        <div className="prompt-suggestions-container">
          <div className="prompt-suggestions-header">
            <LightBulbIcon className="suggestion-icon" />
            <span>Try asking about:</span>
          </div>
          {/* Grid layout for suggestion buttons */}
          <div className="prompt-suggestions-grid">
            {/* Map through each suggestion and create a button */}
            {PROMPT_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                // Apply both base button style and category-specific style
                className={`prompt-suggestion-button ${suggestion.category}`}
                onClick={() => handlePromptClick(suggestion.text)}
              >
                {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}