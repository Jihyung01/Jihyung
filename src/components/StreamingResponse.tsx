import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Brain, 
  X, 
  Copy, 
  Check,
  Sparkle,
  Loader
} from '@phosphor-icons/react';

interface StreamingResponseProps {
  isVisible: boolean;
  onClose: () => void;
  prompt?: string;
  response?: string;
  isStreaming?: boolean;
  onApply?: (response: string) => void;
}

export function StreamingResponse({ 
  isVisible, 
  onClose, 
  prompt = '',
  response = '',
  isStreaming = false,
  onApply
}: StreamingResponseProps) {
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);

  // Simulate streaming effect
  useEffect(() => {
    if (isStreaming && response) {
      setDisplayedResponse('');
      setTypingIndex(0);
      
      const interval = setInterval(() => {
        setTypingIndex(prev => {
          if (prev >= response.length) {
            clearInterval(interval);
            return prev;
          }
          setDisplayedResponse(response.slice(0, prev + 1));
          return prev + 1;
        });
      }, 30); // Typing speed

      return () => clearInterval(interval);
    } else if (!isStreaming) {
      setDisplayedResponse(response);
    }
  }, [response, isStreaming]);

  const handleCopy = async () => {
    if (displayedResponse) {
      await navigator.clipboard.writeText(displayedResponse);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (onApply && displayedResponse) {
      onApply(displayedResponse);
      onClose();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">AI Response</h3>
                {isStreaming && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader className="w-4 h-4 text-blue-500" />
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {displayedResponse && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {onApply && (
                      <Button
                        size="sm"
                        onClick={handleApply}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Sparkle className="w-4 h-4 mr-1" />
                        Apply
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <CardContent className="p-0">
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Prompt Display */}
                {prompt && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b">
                    <div className="text-sm text-muted-foreground mb-1">Prompt:</div>
                    <div className="text-sm">{prompt}</div>
                  </div>
                )}

                {/* Response Content */}
                <div className="p-4 space-y-4">
                  {displayedResponse ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap">{displayedResponse}</div>
                      
                      {/* Typing cursor */}
                      {isStreaming && typingIndex < response.length && (
                        <motion.span
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                          className="inline-block w-2 h-4 bg-blue-500 ml-1"
                        />
                      )}
                    </div>
                  ) : isStreaming ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader className="w-4 h-4" />
                      </motion.div>
                      <span>AI is thinking...</span>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No response yet
                    </div>
                  )}
                </div>
              </div>
            </CardContent>

            {/* Footer Actions */}
            {displayedResponse && !isStreaming && (
              <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 dark:bg-gray-900">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                {onApply && (
                  <Button onClick={handleApply} className="bg-blue-500 hover:bg-blue-600">
                    <Sparkle className="w-4 h-4 mr-1" />
                    Apply Changes
                  </Button>
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
