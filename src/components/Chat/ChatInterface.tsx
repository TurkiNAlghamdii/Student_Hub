import { useState, useEffect, useRef } from 'react';
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
        context = `User is asking about the course: ${courseName}`;
      } else if (contextType === 'exam') {
        context = `User is preparing for exams and needs help with test preparation`;
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
              content: `Please explain this course in detail and help me understand what I'll learn: ${courseDescription}`
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
              content: `What can you tell me about ${courseName}? What topics are typically covered in this course?`
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
        return `👋 Hi! I can help you understand concepts, summarize materials, or create practice questions for ${name || 'this course'}. What would you like to know?`;
      case 'exam':
        return `📝 Hi there! I can help you prepare for exams with practice questions, study guides, and explanations. How can I assist with your exam preparation?`;
      default:
        return "👋 Hello! I'm your academic assistant. I can help with course materials, create practice questions, summarize content, and more. What can I help you with today?";
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

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      handleAIResponse();
    }
  }, [messages, handleAIResponse]);

  useEffect(() => {
    if (isStreamingRef.current) {
      handleAIResponse();
    }
  }, [handleAIResponse]);

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
            <div className="loading-dots">
              <div className="loading-dot"></div>
              <div className="loading-dot delay-75"></div>
              <div className="loading-dot delay-150"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-footer">
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