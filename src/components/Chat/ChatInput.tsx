import React, { FormEvent, useState } from 'react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type your message..."
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

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