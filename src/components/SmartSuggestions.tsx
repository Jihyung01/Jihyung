import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Lightbulb, 
  X, 
  Check, 
  Brain,
  Target,
  Link,
  Hash,
  Calendar,
  Sparkle
} from '@phosphor-icons/react';

interface Suggestion {
  id: string;
  type: 'insight' | 'task' | 'link' | 'tag' | 'schedule' | 'enhancement';
  title: string;
  description: string;
  confidence: number;
  action?: () => void;
  actionLabel?: string;
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  isVisible: boolean;
  onSuggestionApply: (suggestion: Suggestion) => void;
  onSuggestionDismiss: (suggestionId: string) => void;
  onClose: () => void;
}

export function SmartSuggestions({ 
  suggestions, 
  isVisible, 
  onSuggestionApply, 
  onSuggestionDismiss, 
  onClose 
}: SmartSuggestionsProps) {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

  const handleDismiss = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    onSuggestionDismiss(suggestionId);
  };

  const handleApply = (suggestion: Suggestion) => {
    onSuggestionApply(suggestion);
    handleDismiss(suggestion.id);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'insight': return <Brain className="w-4 h-4" />;
      case 'task': return <Target className="w-4 h-4" />;
      case 'link': return <Link className="w-4 h-4" />;
      case 'tag': return <Hash className="w-4 h-4" />;
      case 'schedule': return <Calendar className="w-4 h-4" />;
      case 'enhancement': return <Sparkle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'insight': return 'text-blue-500';
      case 'task': return 'text-green-500';
      case 'link': return 'text-purple-500';
      case 'tag': return 'text-orange-500';
      case 'schedule': return 'text-indigo-500';
      case 'enhancement': return 'text-pink-500';
      default: return 'text-gray-500';
    }
  };

  if (!isVisible || activeSuggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed right-6 top-20 z-40 w-80 max-h-[70vh] overflow-hidden"
      >
        <Card className="shadow-2xl border-2 border-blue-100 dark:border-blue-900">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">Smart Suggestions</h3>
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {activeSuggestions.length}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Suggestions List */}
          <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
            <div className="space-y-0">
              {activeSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Suggestion Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div className={getSuggestionColor(suggestion.type)}>
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className="ml-2 h-5 px-1 text-xs shrink-0"
                      >
                        {suggestion.confidence}%
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApply(suggestion)}
                        className="h-7 px-3 text-xs bg-blue-500 hover:bg-blue-600"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        {suggestion.actionLabel || 'Apply'}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(suggestion.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>

          {/* Footer */}
          <div className="p-3 border-t bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>AI-powered suggestions</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 px-2 text-xs"
              >
                Dismiss All
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
