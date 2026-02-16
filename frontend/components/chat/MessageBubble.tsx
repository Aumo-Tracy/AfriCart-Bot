'use client';

import { useState } from 'react';
import { Copy, Check, User, Bot, Clock, DollarSign } from 'lucide-react';
import { SourcesDisplay } from './SourcesDisplay';
import { ToolCallsDisplay } from './ToolCallsDisplay';
import type { Message } from '@/lib/types';
import { formatTimestamp, copyToClipboard, formatCurrency, formatNumber } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (message.isLoading) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 bg-red-50 rounded-2xl rounded-tl-none p-4 shadow-sm border border-red-200">
          <p className="text-sm text-red-800">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl p-4 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-tr-none'
              : 'bg-white border border-gray-200 rounded-tl-none'
          }`}
        >
          {/* Message Text */}
          <div className="prose prose-sm max-w-none">
            <p className={`whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {message.content}
            </p>
          </div>

          {/* Tool Calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <ToolCallsDisplay toolCalls={message.toolCalls} />
            </div>
          )}

          {/* Metadata Footer */}
          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${
            isUser ? 'border-blue-400' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3 text-xs">
              {/* Timestamp */}
              <span className={`flex items-center gap-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                {formatTimestamp(message.timestamp)}
              </span>

              {/* Token Usage */}
              {message.tokenUsage && (
                <>
                  <span className={isUser ? 'text-blue-100' : 'text-gray-300'}>•</span>
                  <span className={isUser ? 'text-blue-100' : 'text-gray-500'}>
                    {formatNumber(message.tokenUsage.total_tokens)} tokens
                  </span>
                  <span className={isUser ? 'text-blue-100' : 'text-gray-300'}>•</span>
                  <span className={`flex items-center gap-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    <DollarSign className="w-3 h-3" />
                    {formatCurrency(message.tokenUsage.estimated_cost_usd)}
                  </span>
                </>
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`p-1 rounded hover:bg-opacity-20 transition-colors ${
                isUser ? 'hover:bg-white' : 'hover:bg-gray-100'
              }`}
              title="Copy message"
            >
              {copied ? (
                <Check className={`w-4 h-4 ${isUser ? 'text-white' : 'text-green-600'}`} />
              ) : (
                <Copy className={`w-4 h-4 ${isUser ? 'text-blue-100' : 'text-gray-400'}`} />
              )}
            </button>
          </div>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <SourcesDisplay sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}