/**
 * Chat Message Component
 * 
 * This component renders individual chat messages in the chat interface,
 * with different styling based on whether the message is from the user or AI assistant.
 * 
 * Key features:
 * - Visual distinction between user and assistant messages
 * - Loading state animation for pending assistant responses
 * - Pre-formatted text support with whitespace preservation
 * - Responsive design that adapts to message length
 * 
 * The component uses styling that integrates with the application's theme system,
 * with dark-themed default styling for the chat interface. User messages use the
 * application's primary color (emerald) while assistant messages use neutral colors.
 */

import React from 'react';

/**
 * Chat Message Props
 * 
 * Configuration options for the ChatMessage component.
 * 
 * @property role - Identifies whether the message is from the user or assistant
 * @property content - The text content of the message
 * @property isLoading - Optional flag to show a loading animation instead of content
 */
type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
};

/**
 * Chat Message Component
 * 
 * Renders a single message bubble in the chat interface with appropriate styling
 * based on the sender (user or assistant) and current state (loading or complete).
 * 
 * @param role - Whether the message is from the 'user' or 'assistant'
 * @param content - The text content of the message
 * @param isLoading - Whether to show a loading animation instead of content
 * @returns React component for a styled chat message bubble
 */
export default function ChatMessage({ role, content, isLoading = false }: ChatMessageProps) {
  // Determine if this is a user message for styling purposes
  const isUser = role === 'user';

  /**
   * Loading state rendering
   * 
   * When the assistant is generating a response, show an animated loading indicator
   * instead of message content. This provides visual feedback that a response is coming.
   */
  if (isLoading) {
    return (
      <div className="bg-gray-700 text-gray-200 max-w-[80%] rounded-lg p-3 shadow">
        <div className="font-bold mb-1">AI Assistant:</div>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
        </div>
      </div>
    );
  }

  /**
   * Standard message rendering
   * 
   * Renders a message bubble with different styling based on the sender:
   * - User messages: Right-aligned with emerald background (primary theme color)
   * - Assistant messages: Left-aligned with dark gray background
   * 
   * The whitespace-pre-wrap class preserves formatting in the message content,
   * allowing for proper display of code blocks and structured text.
   */
  return (
    <div 
      className={`${
        isUser 
          ? 'bg-emerald-600 text-white ml-auto' 
          : 'bg-gray-700 text-gray-200'
      } max-w-[80%] rounded-lg p-3 shadow`}
    >
      <div className="font-bold mb-1">
        {isUser ? 'You:' : 'AI Assistant:'}
      </div>
      <div className="whitespace-pre-wrap">{content}</div>
    </div>
  );
}