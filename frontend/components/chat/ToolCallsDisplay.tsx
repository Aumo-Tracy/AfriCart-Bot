'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Check, X, Clock } from 'lucide-react';
import type { ToolCall } from '@/lib/types';
import { formatResponseTime } from '@/lib/utils';

interface ToolCallsDisplayProps {
  toolCalls: ToolCall[];
}

export function ToolCallsDisplay({ toolCalls }: ToolCallsDisplayProps) {
  const [expandedTool, setExpandedTool] = useState<number | null>(null);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
        <Wrench className="w-3 h-3" />
        <span className="font-medium">Tools Used ({toolCalls.length})</span>
      </div>

      {toolCalls.map((tool, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded border border-gray-200 overflow-hidden"
        >
          {/* Tool Header */}
          <button
            onClick={() => setExpandedTool(expandedTool === index ? null : index)}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              {tool.success ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs font-medium text-gray-700">
                {tool.tool_name.replace(/_/g, ' ')}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {formatResponseTime(tool.execution_time_ms)}
              </span>
            </div>
            {expandedTool === index ? (
              <ChevronUp className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-600" />
            )}
          </button>

          {/* Tool Details */}
          {expandedTool === index && (
            <div className="px-3 py-2 border-t border-gray-200 space-y-2 text-xs">
              {/* Arguments */}
              {tool.arguments && Object.keys(tool.arguments).length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Arguments:</span>
                  <div className="mt-1 bg-white rounded p-2 border border-gray-100">
                    {Object.entries(tool.arguments).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-600">{key}:</span>
                        <span className="text-gray-800 font-mono text-xs">
                          {JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {tool.result && (
                <div>
                  <span className="font-medium text-gray-700">Result:</span>
                  <div className="mt-1 bg-white rounded p-2 border border-gray-100 max-h-32 overflow-y-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                      {typeof tool.result === 'string'
                        ? tool.result
                        : JSON.stringify(tool.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {tool.error && (
                <div>
                  <span className="font-medium text-red-700">Error:</span>
                  <div className="mt-1 bg-red-50 rounded p-2 border border-red-200">
                    <p className="text-red-800">{tool.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}