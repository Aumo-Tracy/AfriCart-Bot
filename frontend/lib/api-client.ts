// API Client for Backend Communication

import axios, { AxiosError } from 'axios';
import type { ChatRequest, ChatResponse, ApiError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle errors globally
    const apiError: ApiError = {
      error: error.response?.data?.error || 'An unexpected error occurred',
      detail: error.response?.data?.detail,
      error_code: error.response?.data?.error_code,
    };
    return Promise.reject(apiError);
  }
);

/**
 * Send a chat message to the backend
 */
export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  try {
    const response = await apiClient.post<ChatResponse>('/api/chat', request);
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Clear chat session history
 */
export async function clearSession(sessionId: string): Promise<void> {
  try {
    await apiClient.post('/api/chat/clear-session', null, {
      params: { session_id: sessionId },
    });
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Get chat history for a session
 */
export async function getChatHistory(sessionId: string): Promise<any> {
  try {
    const response = await apiClient.get(`/api/chat/history/${sessionId}`);
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<any> {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw error as ApiError;
  }
}

/**
 * Test backend connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await checkHealth();
    return true;
  } catch {
    return false;
  }
}

export default apiClient;