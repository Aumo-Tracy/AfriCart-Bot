'use client';

import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '@/lib/types';


interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, messagesEndRef }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
    >
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to ShopEase Support
            </h2>
            <p className="text-gray-600 mb-6">
              I can help you with orders, returns, shipping, discounts, and more!
            </p>
            <div className="grid grid-cols-1 gap-2 text-left">
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-700">
                  💬 <strong>Ask about policies:</strong> "What's your return policy?"
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-700">
                  📦 <strong>Track orders:</strong> "Where is order ORD-123456?"
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-700">
                  🔍 <strong>Find products:</strong> "Show me wireless headphones"
                </p>
              </div>
              <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <p className="text-sm text-gray-700">
                  💰 <strong>Check discounts:</strong> "Is code SAVE20 valid?"
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}