'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Star } from 'lucide-react';
import type { SourceDocument } from '@/lib/types';

interface SourcesDisplayProps {
  sources: SourceDocument[];
}

export function SourcesDisplay({ sources }: SourcesDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Sources ({sources.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 divide-y divide-gray-200">
          {sources.map((source, index) => (
            <div key={index} className="px-4 py-3">
              {/* Source Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-800">
                    {source.document_name}
                  </h4>
                  {source.metadata && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {source.metadata.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                          {source.metadata.category}
                        </span>
                      )}
                      {source.metadata.source && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-700">
                          {source.metadata.source}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Relevance Score */}
                <div className="flex items-center gap-1 text-xs text-gray-600 ml-2">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {(source.relevance_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Source Content */}
              <div className="text-sm text-gray-600 bg-white rounded p-2 border border-gray-100">
                <p className="line-clamp-3">{source.chunk_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}