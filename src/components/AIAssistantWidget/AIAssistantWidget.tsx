/**
 * AI Assistant Widget Component
 *
 * This component provides a user-friendly interface for accessing the AI chat assistant.
 * It displays example prompts that users can click on to quickly start conversations
 * about common topics, as well as a direct link to the chat interface.
 *
 * Key features:
 * - Quick-access prompt suggestions with smooth animations
 * - Direct navigation to the chat interface
 * - Theme-aware styling with light/dark mode support
 * - Responsive design for various screen sizes
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatBubbleLeftRightIcon, ArrowRightIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import './AIAssistantWidget.css'

/**
 * Predefined prompt suggestions for the AI assistant
 * 
 * These suggestions provide quick-access prompts for common student questions.
 * Each suggestion includes:
 * - text: The actual prompt text that will be sent to the chat
 * - category: Used for styling and categorization (academic, study, cs, productivity)
 */
const PROMPT_SUGGESTIONS = [
  {
    text: "How do I improve my GPA?",
    category: "academic"
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

/**
 * AIAssistantWidget component implementation
 * 
 * Renders a card-style widget that provides access to the AI assistant feature.
 * Includes animated prompt suggestions and a direct chat button.
 * 
 * @returns React component for the AI Assistant Widget
 */
export default function AIAssistantWidget() {
  const router = useRouter()
  
  /**
   * State to track hover state for the chat button animation
   * Used to animate the arrow icon when hovering over the button
   */
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false)
  
  /**
   * Handles clicking on a prompt suggestion
   * Navigates to the chat page with the selected prompt pre-filled
   * 
   * Uses URL encoding to ensure special characters in the prompt text
   * are properly handled in the query parameter
   * 
   * @param promptText - The text of the selected prompt suggestion
   */
  const handlePromptClick = (promptText: string) => {
    router.push(`/chat?question=${encodeURIComponent(promptText)}`)
  }
  
  return (
    <div className="ai-assistant-widget">
      {/* Widget header with title and action button */}
      <div className="widget-header">
        <div className="widget-title-container">
          <ChatBubbleLeftRightIcon className="widget-icon" />
          <h3 className="widget-title">AI Assistant</h3>
        </div>
        <div className="widget-actions">
          {/* Chat button with hover animation effect on the arrow */}
          <button
            className="chat-button"
            onClick={() => router.push('/chat')}
            onMouseEnter={() => setIsChatButtonHovered(true)}
            onMouseLeave={() => setIsChatButtonHovered(false)}
            aria-label="Open AI chat assistant"
          >
            <span>Chat Now</span>
            <ArrowRightIcon 
              className={`h-4 w-4 ml-1 transition-transform duration-300 ${isChatButtonHovered ? 'translate-x-1' : ''}`} 
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      
      {/* Main content area with description and prompt suggestions */}
      <div className="widget-content">
        <p className="widget-description">
          Get instant help with your academic questions
        </p>
        
        {/* Prompt suggestions section with example questions */}
        <div className="prompt-suggestions-container">
          <div className="prompt-suggestions-header">
            <LightBulbIcon className="suggestion-icon" aria-hidden="true" />
            <span>Try asking about:</span>
          </div>
          
          {/* Grid layout for suggestion buttons with animation */}
          <div className="prompt-suggestions-grid">
            {PROMPT_SUGGESTIONS.map((suggestion, index) => (
              <motion.button
                key={index}
                className={`prompt-suggestion-button ${suggestion.category}`}
                onClick={() => handlePromptClick(suggestion.text)}
                aria-label={`Ask about: ${suggestion.text}`}
                
                // Animation configuration for smooth entry
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.2, 
                  delay: 0.05 + (index * 0.05), // Staggered animation
                  ease: "easeOut"
                }}
              >
                {suggestion.text}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}