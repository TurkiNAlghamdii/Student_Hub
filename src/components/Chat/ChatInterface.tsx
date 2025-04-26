/**
 * Chat Interface Component
 * 
 * This component provides an AI-powered chat interface that can be contextualized
 * for different academic scenarios (general, course-specific, or exam preparation).
 * 
 * Features:
 * - Contextual welcome messages based on the type of chat
 * - Course-specific assistance when used within a course
 * - Automatic initial questions based on context
 * - Suggestion buttons for common queries
 * - Error handling and fallbacks for API issues
 * - Real-time message streaming
 * 
 * The component uses CSS classes that are compatible with the application's
 * theme system, supporting both light and dark modes through the root element class.
 */

import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './ChatInterface.css';

/**
 * Message Type
 * 
 * Defines the structure of chat messages exchanged between the user and AI assistant.
 * 
 * @property role - Identifies whether the message is from the user or assistant
 * @property content - The text content of the message
 */
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * ChatInterface Props
 * 
 * Configuration options for the ChatInterface component.
 * 
 * @property contextType - Determines the type of assistant and welcome message
 *                        'general' - General academic assistant
 *                        'course' - Course-specific assistant
 *                        'exam' - Exam preparation assistant
 * @property courseName - Name of the course when contextType is 'course'
 * @property initialQuestion - Optional question to start the conversation with
 */
type ChatInterfaceProps = {
  contextType?: 'general' | 'course' | 'exam';
  courseName?: string;
  initialQuestion?: string | null;
};

/**
 * ChatInterface Component
 * 
 * Main component for AI-powered chat functionality that adapts to different academic contexts.
 * The component manages message history, user input, API communication, and UI states.
 * 
 * @param props - Configuration options for the chat interface
 * @returns Rendered chat interface with messages, input field, and suggestion buttons
 */
export default function ChatInterface({ 
  contextType = 'general', 
  courseName,
  initialQuestion = null
}: ChatInterfaceProps) {
  /**
   * Component State
   * 
   * - messages: Array of chat messages between user and assistant
   * - userInput: Current text in the input field
   * - isLoading: Loading state during API calls
   * - chatContainerRef: Reference to the chat container for auto-scrolling
   * - hasInitializedRef: Prevents duplicate initialization
   * - isStreamingRef: Tracks if a message is currently streaming
   * - showSuggestions: Controls visibility of suggestion buttons
   */
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const isStreamingRef = useRef(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  /**
   * Debug and CSS Verification Effect
   * 
   * This effect serves two purposes:
   * 1. Logs component initialization with context information for debugging
   * 2. Verifies that the component's CSS has been properly loaded
   * 
   * The CSS verification is important to ensure the chat interface renders
   * correctly with proper styling, especially for theme compatibility.
   * This helps diagnose styling issues during development.
   */
  useEffect(() => {
    console.log('ChatInterface mounted with context:', contextType, 'courseName:', courseName, 'initialQuestion:', initialQuestion);
    
    // Check if the CSS is loaded
    const styleSheets = document.styleSheets;
    let chatStylesFound = false;
    
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules;
        for (let j = 0; j < rules.length; j++) {
          if (rules[j].cssText && rules[j].cssText.includes('.chat-container')) {
            chatStylesFound = true;
            break;
          }
        }
        if (chatStylesFound) break;
      } catch {
        console.warn('Could not access cssRules for stylesheet', i);
      }
    }
    
    console.log('ChatInterface CSS loaded:', chatStylesFound);
    
    return () => {
      console.log('ChatInterface unmounted');
    };
  }, [contextType, courseName, initialQuestion]);

  /**
   * Handle AI Response Function
   * 
   * Manages communication with the chat API endpoint and processes responses.
   * This function is responsible for:
   * 1. Preparing the context and message history for the API
   * 2. Making the API request with proper error handling
   * 3. Processing the response and updating the UI
   * 4. Providing fallback responses for common error scenarios
   * 
   * The function includes special handling for API key errors to provide
   * a helpful message to users when the OpenAI API key is missing or invalid.
   * 
   * @param userMessage - Optional user message to send to the API
   */
  const handleAIResponse = async (userMessage?: Message) => {
    console.log('ChatInterface: Sending message to API:', userMessage?.content);
    setIsLoading(true);
    
    try {
      // Prepare context information
      let context = '';
      if (contextType === 'course' && courseName) {
        context = courseName;
      }
      
      // Convert messages to format expected by API
      const apiMessages = messages
        .concat(userMessage || { role: 'user', content: '' })
        .map(({ role, content }) => ({ role, content }));
      
      console.log('ChatInterface: Calling /api/chat with messages:', apiMessages.length);
      
      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          context,
          contextType
        }),
      });
      
      if (!response.ok) {
        console.error('ChatInterface: API error status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to get response from AI. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('ChatInterface: Received response from API');
      
      // Add AI response to chat
      if (data.message && data.message.content) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message.content,
        };
        
        console.log('ChatInterface: Adding AI response to chat');
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err) {
      /**
       * Error Handling with User-Friendly Fallbacks
       * 
       * Provides specific error messages based on the type of error:
       * - API key issues: Informs the user that the admin needs to set up an API key
       * - Other errors: Shows a generic error message with the specific error details
       * 
       * This ensures users always get feedback even when the API fails.
       */
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      
      if (errorMessage.includes('API key')) {
        // Provide a fallback response for API key issues
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: "I'm sorry, but the AI service is currently unavailable. The administrator needs to set up a valid OpenAI API key. Please try again later or contact support."
        }]);
      } else {
        // Add generic error message
        setMessages(prev => [...prev, {
          role: 'assistant' as const, 
          content: `Error: ${errorMessage}. Please try again.`
        }]);
      }
      
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Chat Initialization Effect
   * 
   * This effect handles the initial setup of the chat interface with a welcome message
   * and potentially an automatic first question based on the context:
   * 
   * - For course context: Uses course description from session storage if available,
   *   or generates a generic course-related question
   * - For initial questions: Processes questions passed directly to the component
   * 
   * The initialization only happens once per component instance to prevent duplicate
   * welcome messages when the component re-renders.
   */
  useEffect(() => {
    if (hasInitializedRef.current) {
      console.log('ChatInterface: Already initialized, skipping');
      return;
    }
    
    console.log('ChatInterface: Initializing with initialQuestion =', initialQuestion);
    hasInitializedRef.current = true;

    try {
      // Always start with welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: getWelcomeMessage(contextType, courseName),
      };
      
      // Initialize messages with welcome message
      setMessages([welcomeMessage]);
      console.log('ChatInterface: Set welcome message');
      
      /**
       * Course-Specific Initialization
       * 
       * For course context, we check if there's a course description in session storage.
       * If found, we use it to generate a detailed initial question about the course.
       * If not, we fall back to a generic question based on the course name.
       * 
       * This provides immediate value to the user without requiring them to formulate
       * the first question, making the chat interface more helpful from the start.
       */
      if (typeof window !== 'undefined' && contextType === 'course') {
        const courseDescription = sessionStorage.getItem('courseDescription');
        
        if (courseDescription) {
          // Remove the course description from session storage to avoid using it multiple times
          sessionStorage.removeItem('courseDescription');
          
          // Set a timeout to allow the welcome message to be displayed first
          setTimeout(() => {
            // Create a user message with the course description
            const userMessage: Message = {
              role: 'user',
              content: `Here is the description for this course: "${courseDescription}". Based on this description, could you:
1. Summarize the key topics I'll learn
2. Explain what skills I should develop
3. Suggest how to approach studying this material
4. Mention any prerequisites I should be familiar with`
            };
            
            // Add the user message and trigger the AI response
            setMessages(prev => [...prev, userMessage]);
            handleAIResponse(userMessage);
          }, 1000);
        } else if (courseName) {
          // If we have a course name but no description, create a generic question
          setTimeout(() => {
            const userMessage: Message = {
              role: 'user',
              content: `I'm taking ${courseName}. Could you help me understand:
1. What main topics are typically covered in this course?
2. What key concepts should I focus on mastering?
3. What learning resources might be helpful?
4. How this course connects to other subjects in the field?`
            };
            
            setMessages(prev => [...prev, userMessage]);
            handleAIResponse(userMessage);
          }, 1000);
        }
      } 
      /**
       * Initial Question Handling
       * 
       * If an initial question was provided to the component (e.g., from a widget),
       * we process it after displaying the welcome message.
       * 
       * This allows for seamless integration with other components that might want
       * to start a conversation with a specific question.
       */
      else if (initialQuestion) {
        console.log('ChatInterface: Processing initialQuestion:', initialQuestion);
        
        // Set a timeout to allow the welcome message to be displayed first
        setTimeout(() => {
          // Create a message object from the question
          const userMessage: Message = {
            role: 'user',
            content: initialQuestion
          };
          
          console.log('ChatInterface: Adding user message to chat');
          // Add the user message to the chat
          setMessages(prev => [...prev, userMessage]);
          
          // Send to AI after a short delay
          setTimeout(() => {
            console.log('ChatInterface: Sending to AI:', userMessage.content);
            handleAIResponse(userMessage);
          }, 100);
        }, 1000);
      }
    } catch (error) {
      console.error('ChatInterface: Error in initialization:', error);
    }
  }, [contextType, courseName, initialQuestion, handleAIResponse]);

  /**
   * Auto-scroll Effect
   * 
   * Automatically scrolls the chat container to the bottom whenever new messages are added.
   * This ensures that the most recent messages are always visible to the user.
   */
  useEffect(() => {
    try {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }, [messages]);

  /**
   * Get Welcome Message Function
   * 
   * Generates a contextual welcome message based on the type of chat (general, course, or exam).
   * Each welcome message is tailored to the specific context and includes bullet points
   * highlighting the capabilities of the AI assistant in that context.
   * 
   * The welcome messages are designed to be friendly, informative, and to encourage
   * the user to engage with specific types of questions appropriate for the context.
   * 
   * @param type - The type of chat context ('general', 'course', or 'exam')
   * @param name - Optional name (e.g., course name) to personalize the welcome message
   * @returns A formatted welcome message string with capabilities and a prompt
   */
  function getWelcomeMessage(type: string, name?: string): string {
    switch (type) {
      case 'course':
        return `👋 Welcome to the ${name || 'course'} AI assistant! I can help you:
• Understand key concepts and theories
• Create practice questions specific to this course
• Summarize lecture materials and readings
• Develop study guides for upcoming exams
• Clarify assignments and requirements

What specific aspect of ${name || 'this course'} would you like help with today?`;
      
      case 'exam':
        return `📝 Exam Preparation Assistant at your service! I can help you:
• Create custom practice questions based on your study topics
• Develop comprehensive study guides and summaries
• Explain complex concepts you need to master
• Provide memory techniques for difficult material
• Suggest effective study strategies and schedules

What specific exam or subject are you preparing for?`;
      
      default:
        return `👋 Welcome to your Academic AI Assistant! I'm here to support your learning journey with:
• Course-specific help and explanations
• Practice questions and study materials
• Research assistance and resource recommendations
• Time management and study strategies
• Writing and project planning support

How can I assist with your academic needs today?`;
    }
  }
  /**
   * Message Sending Handler
   * 
   * Processes user input when the send button is clicked or Enter is pressed.
   * Creates a message object from the input, adds it to the chat, and triggers the AI response.
   */
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: userInput,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    
    // Handle AI response
    await handleAIResponse(userMessage);
  };

  /**
   * Keyboard Event Handler
   * 
   * Handles keyboard events in the input field, specifically detecting
   * when the Enter key is pressed without the Shift key to send the message.
   * Shift+Enter allows for multi-line input.
   * 
   * @param e - Keyboard event from the input field
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * Custom Question Event Listener
   * 
   * Listens for custom events that might be dispatched by other components
   * to send questions directly to the chat interface.
   * 
   * This allows for integration with other parts of the application,
   * such as a floating AI assistant button or course material pages.
   */
  useEffect(() => {
    const handleCustomQuestion = (event: CustomEvent) => {
      if (event.detail && event.detail.question) {
        console.log('ChatInterface: Received custom event with question:', event.detail.question);
        
        if (messages.length > 0) {
          // If we already have messages, treat this as a user sending a new message
          const userMessage: Message = {
            role: 'user',
            content: event.detail.question
          };
          
          // Add to chat and send to AI
          setMessages(prev => [...prev, userMessage]);
          handleAIResponse(userMessage);
        } else {
          // If no messages yet (unlikely), set initialQuestion to trigger the normal flow
          console.log('ChatInterface: No messages yet, waiting for initialization');
        }
      }
    };
    
    // Add event listener for custom question events
    window.addEventListener('send-chat-question', handleCustomQuestion as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('send-chat-question', handleCustomQuestion as EventListener);
    };
  }, [messages, handleAIResponse]);

  /**
   * Streaming Effect
   * 
   * Handles the continuation of message streaming when the loading state changes.
   * This ensures that streaming responses are properly handled even if they span
   * multiple API calls.
   */
  useEffect(() => {
    if (isStreamingRef.current && !isLoading) {
      handleAIResponse();
    }
  }, [handleAIResponse, isLoading]);

  /**
   * Suggestion Click Handler
   * 
   * Handles clicks on suggestion buttons by setting the input field to the
   * suggested text and hiding the suggestions panel.
   * 
   * @param suggestion - The suggested text to populate in the input field
   */
  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    // Hide suggestions after clicking one
    setShowSuggestions(false);
  };

  /**
   * Component Render
   * 
   * Renders the chat interface with the following elements:
   * - Message history with distinct styling for user and assistant messages
   * - Loading indicator when waiting for AI response
   * - Suggestion buttons for common questions (shown for new conversations)
   * - Input form with text field and send button
   * - Disclaimer about AI-generated responses
   * 
   * The component uses CSS classes that are compatible with the application's
   * theme system, supporting both light and dark modes through the root element class.
   */
  return (
    <div className="chat-container">
      <div 
        ref={chatContainerRef}
        className="chat-messages-container"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={msg.role === 'user' ? 'user-message' : 'assistant-message'}
          >
            <div className="message-header">
              {msg.role === 'user' ? (
                'You:'
              ) : (
                <span className="flex items-center">
                  <span className="ai-indicator"></span>
                  Assistant
                </span>
              )}
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="assistant-message">
            <div className="message-header">
              <span className="flex items-center">
                <span className="ai-indicator"></span>
                Assistant
              </span>
            </div>
            <LoadingSpinner size="small" />
          </div>
        )}
      </div>
      
      <div className="chat-footer">
        {/* Suggestion Buttons - Only shown for new conversations */}
        {showSuggestions && messages.length < 3 && (
          <div className="quick-suggestions">
            <p className="suggestions-title">Try asking about:</p>
            <div className="suggestions-buttons">
              <button 
                onClick={() => handleSuggestionClick("Can you create 5 practice questions about the main topics in this course?")}
                className="suggestion-button"
              >
                Practice Questions
              </button>
              <button 
                onClick={() => handleSuggestionClick("What study strategies would you recommend for mastering this material?")}
                className="suggestion-button"
              >
                Study Strategies
              </button>
              <button 
                onClick={() => handleSuggestionClick("Please create a concept map showing how the key topics in this subject are related.")}
                className="suggestion-button"
              >
                Concept Map
              </button>
              <button 
                onClick={() => handleSuggestionClick("Can you summarize the most important concepts I should focus on?")}
                className="suggestion-button"
              >
                Key Concepts
              </button>
            </div>
          </div>
        )}
        {/* Message Input Form */}
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} className="input-form">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Type your message..."
            className="chat-input"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className={`send-button ${isLoading || !userInput.trim() ? 'send-button-disabled' : 'send-button-enabled'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="footer-text">
          Responses are AI-generated • May not always be accurate
        </p>
      </div>
    </div>
  );
}