/**
 * Chat Input Component
 * 
 * This component provides a text input field with a send button for the chat interface.
 * It handles user message input, validation, and submission to the parent component.
 * 
 * Key features:
 * - Text input with real-time validation
 * - Submit button with dynamic styling based on input state
 * - Keyboard shortcut support (Enter to send)
 * - Disabled state handling during message processing
 * 
 * The component uses styling that is compatible with the application's theme system,
 * with dark-themed default styling that integrates with the chat interface's appearance.
 */

import React, { FormEvent, useState } from 'react';

/**
 * Chat Input Props
 * 
 * Configuration options for the ChatInput component.
 * 
 * @property onSendMessage - Callback function that receives the user's message when submitted
 * @property disabled - Optional flag to disable the input during message processing
 * @property placeholder - Optional custom placeholder text for the input field
 */
type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Chat Input Component
 * 
 * A form input component that captures user messages for the chat interface.
 * It manages its own state for the input text and handles form submission.
 * 
 * @param onSendMessage - Function to call when a message is submitted
 * @param disabled - Whether the input should be disabled (e.g., while waiting for a response)
 * @param placeholder - Custom placeholder text for the input field
 * @returns React component with text input and send button
 */
export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message..."
}: ChatInputProps) {
  // State to track the current message being typed
  const [message, setMessage] = useState('');

  /**
   * Handle form submission
   * 
   * Prevents default form submission behavior, validates the message,
   * calls the onSendMessage callback with the current message,
   * and clears the input field.
   * 
   * @param e - Form event from the submit action
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  /**
   * Handle keyboard events
   * 
   * Allows users to submit messages by pressing Enter (without Shift).
   * This provides a convenient way to send messages without clicking the button.
   * 
   * @param e - Keyboard event from key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 pr-12 focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !message.trim()}
        className={`absolute right-2 p-2 rounded-full ${
          disabled || !message.trim() 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>
    </div>
  );
} 