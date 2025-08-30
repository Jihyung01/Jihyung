import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AIRequest {
  id: string;
  type: 'enhance' | 'analyze' | 'generate' | 'summarize' | 'classify';
  input: string;
  context?: any;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
}

interface AIResponse {
  id: string;
  requestId: string;
  result: string;
  confidence: number;
  metadata?: any;
  timestamp: number;
}

interface AITaskProgress {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime?: number;
}

interface AIMode {
  id: string;
  name: string;
  description: string;
  processing: {
    enhance: boolean;
    analyze: boolean;
    autoSuggest: boolean;
    autoSchedule: boolean;
  };
}

interface AIOrchestratorProps {
  mode: 'conservative' | 'balanced' | 'aggressive';
  enabled: boolean;
  onResponse: (response: AIResponse) => void;
  onProgress: (progress: AITaskProgress) => void;
  onModeChange?: (mode: string) => void;
}

export function AIOrchestrator({ 
  mode, 
  enabled, 
  onResponse, 
  onProgress,
  onModeChange 
}: AIOrchestratorProps) {
  const [requestQueue, setRequestQueue] = useState<AIRequest[]>([]);
  const [activeRequests, setActiveRequests] = useState<Map<string, AITaskProgress>>(new Map());
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const aiModes: AIMode[] = [
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Minimal AI intervention, user-triggered only',
      processing: {
        enhance: false,
        analyze: true,
        autoSuggest: false,
        autoSchedule: false
      }
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Smart suggestions with user control',
      processing: {
        enhance: true,
        analyze: true,
        autoSuggest: true,
        autoSchedule: false
      }
    },
    {
      id: 'aggressive',
      name: 'Aggressive',
      description: 'Full AI automation and proactive assistance',
      processing: {
        enhance: true,
        analyze: true,
        autoSuggest: true,
        autoSchedule: true
      }
    }
  ];

  const currentMode = aiModes.find(m => m.id === mode) || aiModes[1];

  // Queue management
  const addToQueue = useCallback((request: AIRequest) => {
    if (!enabled) return;
    
    setRequestQueue(prev => {
      const updated = [...prev, request];
      return updated.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    });
  }, [enabled]);

  const processQueue = useCallback(async () => {
    if (isProcessing || requestQueue.length === 0) return;
    
    setIsProcessing(true);
    const request = requestQueue[0];
    
    // Remove from queue
    setRequestQueue(prev => prev.slice(1));
    
    // Add to active requests
    const progress: AITaskProgress = {
      id: request.id,
      status: 'processing',
      progress: 0,
      estimatedTime: getEstimatedTime(request.type)
    };
    
    setActiveRequests(prev => new Map([...prev, [request.id, progress]]));
    onProgress(progress);

    try {
      // Simulate AI processing
      const response = await simulateAIProcessing(request, (progressUpdate) => {
        const updatedProgress = { ...progress, ...progressUpdate };
        setActiveRequests(prev => new Map([...prev, [request.id, updatedProgress]]));
        onProgress(updatedProgress);
      });

      // Mark as completed
      const completedProgress: AITaskProgress = {
        id: request.id,
        status: 'completed',
        progress: 100
      };
      
      setActiveRequests(prev => new Map([...prev, [request.id, completedProgress]]));
      onProgress(completedProgress);
      
      // Add response
      setResponses(prev => [...prev, response]);
      onResponse(response);

      // Clean up after delay
      setTimeout(() => {
        setActiveRequests(prev => {
          const updated = new Map(prev);
          updated.delete(request.id);
          return updated;
        });
      }, 2000);

    } catch (error) {
      // Handle error
      const failedProgress: AITaskProgress = {
        id: request.id,
        status: 'failed',
        progress: 0
      };
      
      setActiveRequests(prev => new Map([...prev, [request.id, failedProgress]]));
      onProgress(failedProgress);
    }

    setIsProcessing(false);
  }, [isProcessing, requestQueue, onProgress, onResponse]);

  // Process queue when new requests arrive
  useEffect(() => {
    if (requestQueue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [requestQueue, isProcessing, processQueue]);

  const getEstimatedTime = (type: string): number => {
    switch (type) {
      case 'enhance': return 3000;
      case 'analyze': return 2000;
      case 'generate': return 5000;
      case 'summarize': return 1500;
      case 'classify': return 1000;
      default: return 2000;
    }
  };

  const simulateAIProcessing = async (
    request: AIRequest, 
    onProgressUpdate: (update: Partial<AITaskProgress>) => void
  ): Promise<AIResponse> => {
    const estimatedTime = getEstimatedTime(request.type);
    const steps = 10;
    const stepTime = estimatedTime / steps;

    // Simulate processing steps
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      onProgressUpdate({ progress: (i / steps) * 100 });
    }

    // Generate mock response based on request type
    const response: AIResponse = {
      id: `response-${Date.now()}`,
      requestId: request.id,
      result: generateMockResponse(request),
      confidence: Math.random() * 30 + 70, // 70-100%
      timestamp: Date.now()
    };

    return response;
  };

  const generateMockResponse = (request: AIRequest): string => {
    switch (request.type) {
      case 'enhance':
        return `Enhanced version: ${request.input}\n\nKey improvements:\n• Better clarity and structure\n• Added relevant context\n• Improved readability`;
      
      case 'analyze':
        return `Analysis of "${request.input}":\n\n• Main themes: productivity, organization\n• Sentiment: positive\n• Suggested tags: #productivity #planning\n• Related concepts: time management, goal setting`;
      
      case 'generate':
        return `Generated content based on "${request.input}":\n\nThis could be expanded into a comprehensive plan with the following elements:\n1. Initial assessment\n2. Goal definition\n3. Action steps\n4. Timeline and milestones`;
      
      case 'summarize':
        return `Summary: ${request.input.slice(0, 100)}...\n\nKey points:\n• Main topic identified\n• Core concepts extracted\n• Action items suggested`;
      
      case 'classify':
        return `Classification results:\n• Category: General note\n• Priority: Medium\n• Suggested folder: Ideas\n• Recommended tags: #note #idea`;
      
      default:
        return 'AI processing completed successfully.';
    }
  };

  // Public API for other components
  const orchestrator = {
    addToQueue,
    
    enhance: (text: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
      if (currentMode.processing.enhance) {
        addToQueue({
          id: `enhance-${Date.now()}`,
          type: 'enhance',
          input: text,
          priority,
          timestamp: Date.now()
        });
      }
    },

    analyze: (text: string, context?: any) => {
      if (currentMode.processing.analyze) {
        addToQueue({
          id: `analyze-${Date.now()}`,
          type: 'analyze',
          input: text,
          context,
          priority: 'low',
          timestamp: Date.now()
        });
      }
    },

    generate: (prompt: string, priority: 'low' | 'medium' | 'high' = 'high') => {
      addToQueue({
        id: `generate-${Date.now()}`,
        type: 'generate',
        input: prompt,
        priority,
        timestamp: Date.now()
      });
    },

    summarize: (text: string) => {
      addToQueue({
        id: `summarize-${Date.now()}`,
        type: 'summarize',
        input: text,
        priority: 'medium',
        timestamp: Date.now()
      });
    },

    classify: (text: string) => {
      if (currentMode.processing.autoSuggest) {
        addToQueue({
          id: `classify-${Date.now()}`,
          type: 'classify',
          input: text,
          priority: 'low',
          timestamp: Date.now()
        });
      }
    },

    getStatus: () => ({
      queueLength: requestQueue.length,
      activeRequests: Array.from(activeRequests.values()),
      mode: currentMode,
      enabled,
      isProcessing
    }),

    clearQueue: () => {
      setRequestQueue([]);
    }
  };

  // Expose orchestrator instance
  React.useImperativeHandle(React.createRef(), () => orchestrator);

  // Make orchestrator available globally for other components
  useEffect(() => {
    (window as any).aiOrchestrator = orchestrator;
    return () => {
      delete (window as any).aiOrchestrator;
    };
  }, [orchestrator]);

  if (!enabled) return null;

  return (
    <div className="ai-orchestrator">
      {/* Processing indicator */}
      {(isProcessing || activeRequests.size > 0) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            <span className="text-sm">AI Processing ({activeRequests.size})</span>
          </div>
        </motion.div>
      )}

      {/* Mode indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg border">
          <div className="text-xs text-muted-foreground">AI Mode</div>
          <div className="text-sm font-medium">{currentMode.name}</div>
        </div>
      </div>
    </div>
  );
}
