'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Mail } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string, email?: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;

    onSendMessage(message, email || undefined);
    setMessage('');
    setEmail('');
    setShowEmailInput(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const maxLength = 2000;
  const remaining = maxLength - message.length;

  return (
    <div className="space-y-2">
      {/* Email Input (Optional) */}
      {showEmailInput && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
          <Mail className="w-4 h-4 text-blue-600" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com (for order tracking)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
          />
          <button
            onClick={() => {
              setShowEmailInput(false);
              setEmail('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
      )}

      {/* Main Input */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about orders, returns, products, or policies..."
            disabled={isLoading}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-3 pr-16 rounded-2xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none text-gray-800 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            style={{ minHeight: '48px', maxHeight: '200px' }}
          />

          {/* Character Counter */}
          {message.length > maxLength * 0.8 && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {remaining}
            </div>
          )}
        </div>

        {/* Email Button */}
        <button
          onClick={() => setShowEmailInput(!showEmailInput)}
          disabled={isLoading}
          className={`p-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            showEmailInput || email
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={showEmailInput ? 'Hide email field' : 'Add email (for order tracking)'}
        >
          <Mail className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading}
          className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
          title="Send message (Enter)"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Enter</kbd> to send,{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">Shift + Enter</kbd> for new line
        </span>
        {showEmailInput && (
          <span className="text-blue-600">
            Email will be used for order verification
          </span>
        )}
      </div>
    </div>
  );
}