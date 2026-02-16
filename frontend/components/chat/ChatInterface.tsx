'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ErrorDisplay } from './ErrorDisplay';
import { sendChatMessage, clearSession, testConnection } from '@/lib/api-client';
import { getOrCreateSessionId, clearStoredSessionId, generateId } from '@/lib/utils';
import type { Message, ChatSession } from '@/lib/types';
import { RefreshCw, Trash2, AlertCircle } from 'lucide-react';

export function ChatInterface() {
  const [session, setSession] = useState<ChatSession>({
    sessionId: '',
    messages: [],
    totalTokens: 0,
    totalCost: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session and check backend
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    setSession((prev) => ({ ...prev, sessionId }));

    // Check backend connection
    checkBackend();
  }, []);

  const checkBackend = async () => {
    setBackendStatus('checking');
    const isOnline = await testConnection();
    setBackendStatus(isOnline ? 'online' : 'offline');
    
    if (!isOnline) {
      setError('Cannot connect to backend server. Make sure it\'s running on http://localhost:8000');
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSendMessage = async (content: string, userEmail?: string) => {
    if (!content.trim() || isLoading) return;

    // Check backend first
    if (backendStatus === 'offline') {
      setError('Backend is offline. Please start the backend server.');
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    // Add loading message
    const loadingMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, loadingMessage],
    }));

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage({
        message: content.trim(),
        session_id: session.sessionId,
        user_email: userEmail,
        include_sources: true,
      });

      // Remove loading message and add real response
      setSession((prev) => {
        const messagesWithoutLoading = prev.messages.filter(
          (m) => m.id !== loadingMessage.id
        );

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date(response.timestamp),
          sources: response.sources,
          toolCalls: response.tool_calls,
          tokenUsage: response.token_usage,
        };

        const newTotalTokens = prev.totalTokens + (response.token_usage?.total_tokens || 0);
        const newTotalCost = prev.totalCost + (response.token_usage?.estimated_cost_usd || 0);

        return {
          ...prev,
          messages: [...messagesWithoutLoading, assistantMessage],
          totalTokens: newTotalTokens,
          totalCost: newTotalCost,
        };
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      
      // Remove loading message
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== loadingMessage.id),
      }));

      // Set user-friendly error
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
      await clearSession(session.sessionId);
      clearStoredSessionId();
      
      const newSessionId = getOrCreateSessionId();
      setSession({
        sessionId: newSessionId,
        messages: [],
        totalTokens: 0,
        totalCost: 0,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to clear session:', err);
    }
  };

  const handleRetry = () => {
    const lastUserMessage = [...session.messages]
      .reverse()
      .find((m) => m.role === 'user');

    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              ShopEase AI Support
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                Your intelligent shopping assistant
              </p>
              {/* Backend Status Indicator */}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' 
                    ? 'bg-green-500' 
                    : backendStatus === 'offline' 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500 animate-pulse'
                }`} />
                <span className="text-xs text-gray-500">
                  {backendStatus === 'online' 
                    ? 'Backend online' 
                    : backendStatus === 'offline' 
                    ? 'Backend offline' 
                    : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Stats */}
            {session.totalTokens > 0 && (
              <div className="text-xs text-gray-600 mr-4 text-right">
                <div>Tokens: {session.totalTokens.toLocaleString()}</div>
                <div>Cost: ${session.totalCost.toFixed(4)}</div>
              </div>
            )}
            
            {/* Refresh backend status */}
            <button
              onClick={checkBackend}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh backend status"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Clear button */}
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Backend Offline Warning */}
      {backendStatus === 'offline' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>Backend server is not responding. Make sure it's running on http://localhost:8000</span>
            <button 
              onClick={checkBackend}
              className="ml-auto text-yellow-900 hover:text-yellow-950 font-medium"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <MessageList 
            messages={session.messages} 
            messagesEndRef={messagesEndRef}
          />
          
          {/* Error Display */}
          {error && (
            <ErrorDisplay 
              error={error}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
            />
          )}
        </div>
      </main>

      {/* Input */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading}
            disabled={backendStatus === 'offline'}
          />
          
          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center mt-2">
            AI responses may contain errors. Verify important information.
          </p>
        </div>
      </footer>
    </div>
  );
}