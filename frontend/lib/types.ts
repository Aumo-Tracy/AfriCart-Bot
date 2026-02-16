// TypeScript Types for E-Commerce Support AI

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: SourceDocument[];
  toolCalls?: ToolCall[];
  tokenUsage?: TokenUsage;
  isLoading?: boolean;
  error?: string;
}

export interface SourceDocument {
  document_name: string;
  chunk_text: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result: any;
  execution_time_ms: number;
  success: boolean;
  error?: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  model: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  user_email?: string;
  include_sources?: boolean;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  sources?: SourceDocument[];
  tool_calls?: ToolCall[];
  token_usage?: TokenUsage;
  response_time_ms: number;
  timestamp: string;
}

export interface ApiError {
  error: string;
  detail?: string;
  error_code?: string;
  timestamp?: string;
}

export interface ChatSession {
  sessionId: string;
  messages: Message[];
  totalTokens: number;
  totalCost: number;
}