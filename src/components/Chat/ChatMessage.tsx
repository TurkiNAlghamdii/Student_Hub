import React from 'react';

type ChatMessageProps = {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
};

export default function ChatMessage({ role, content, isLoading = false }: ChatMessageProps) {
  const isUser = role === 'user';

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