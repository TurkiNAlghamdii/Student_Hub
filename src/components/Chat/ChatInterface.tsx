import { useState, useEffect, useRef } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';
import './ChatInterface.css';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatInterfaceProps = {
  contextType?: 'general' | 'course' | 'exam';
  courseName?: string;
  initialQuestion?: string | null;
};

export default function ChatInterface({ 
  contextType = 'general', 
  courseName,
  initialQuestion = null
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const isStreamingRef = useRef(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Debug log
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

  // Function to handle AI response to a message
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
      // Add error message or fallback response
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

  // Initialize with a welcome message and check for course description or initial question
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
      
      // Handle course description check
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
      // Handle initial question from AI Assistant widget if present
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

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    try {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error scrolling to bottom:', error);
    }
  }, [messages]);

  // Function to get appropriate welcome message based on context
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Listen for direct question sending events
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

  // Keep the streaming effect but add a check to prevent duplicates
  useEffect(() => {
    if (isStreamingRef.current && !isLoading) {
      handleAIResponse();
    }
  }, [handleAIResponse, isLoading]);

  // Add helper function for suggestions
  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    // Hide suggestions after clicking one
    setShowSuggestions(false);
  };

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