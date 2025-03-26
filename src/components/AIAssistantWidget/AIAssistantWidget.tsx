'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatBubbleLeftRightIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import './AIAssistantWidget.css'

export default function AIAssistantWidget() {
  const router = useRouter()
  const [isChatButtonHovered, setIsChatButtonHovered] = useState(false)
  
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
      </div>
    </div>
  )
} 