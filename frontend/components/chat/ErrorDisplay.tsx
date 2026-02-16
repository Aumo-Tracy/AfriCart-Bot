'use client';

import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  // Parse error to provide better messages
  const getErrorInfo = (errorMsg: string) => {
    if (errorMsg.includes('Network Error') || errorMsg.includes('ERR_CONNECTION')) {
      return {
        title: 'Connection Failed',
        message: 'Cannot connect to the backend server. Make sure it\'s running on http://localhost:8000',
        action: 'Check Backend',
        canRetry: true,
      };
    }

    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      return {
        title: 'Rate Limit Exceeded',
        message: 'The OpenAI API rate limit has been reached. Please wait a moment and try again.',
        action: 'Retry',
        canRetry: true,
      };
    }

    if (errorMsg.includes('500') || errorMsg.includes('Internal Server Error')) {
      return {
        title: 'Server Error',
        message: 'The backend encountered an error. Check the backend logs for details.',
        action: 'Retry',
        canRetry: true,
      };
    }

    if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. The backend might be processing a complex query.',
        action: 'Retry',
        canRetry: true,
      };
    }

    if (errorMsg.includes('CORS')) {
      return {
        title: 'CORS Error',
        message: 'Cross-origin request blocked. Make sure the backend allows requests from localhost:3000',
        action: 'Check Settings',
        canRetry: false,
      };
    }

    if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
      return {
        title: 'Authentication Error',
        message: 'API authentication failed. Check your OpenAI API key in the backend .env file.',
        action: 'Check API Key',
        canRetry: false,
      };
    }

    return {
      title: 'Something Went Wrong',
      message: errorMsg,
      action: 'Retry',
      canRetry: true,
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="mx-4 mb-4 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            {errorInfo.title}
          </h3>
          <p className="text-sm text-red-800 mb-3">
            {errorInfo.message}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {errorInfo.canRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-900 text-sm font-medium rounded-md transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {errorInfo.action}
              </button>
            )}

            <button
              onClick={onDismiss}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-200 transition-colors"
            >
              Dismiss
            </button>

            <a
              href="http://localhost:8000/health"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-700 hover:text-red-900 text-sm font-medium transition-colors"
            >
              Check Backend Status
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}