import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { 
  Brain, 
  Sparkle, 
  Link, 
  Target,
  Calendar,
  Hash,
  Copy
} from '@phosphor-icons/react';

interface FloatingToolbarProps {
  selectedText: string;
  position: { x: number; y: number };
  isVisible: boolean;
  onAction: (action: string, text: string) => void;
  onClose: () => void;
}

export function FloatingToolbar({ 
  selectedText, 
  position, 
  isVisible, 
  onAction, 
  onClose 
}: FloatingToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
      setShowMore(false);
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !selectedText.trim()) return null;

  const actions = [
    {
      icon: <Brain className="w-4 h-4" />,
      label: 'Ask AI',
      action: 'ai-ask',
      primary: true
    },
    {
      icon: <Sparkle className="w-4 h-4" />,
      label: 'Enhance',
      action: 'ai-enhance',
      primary: true
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: 'To Task',
      action: 'create-task'
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: 'Schedule',
      action: 'create-event'
    },
    {
      icon: <Link className="w-4 h-4" />,
      label: 'Link Note',
      action: 'link-note'
    },
    {
      icon: <Hash className="w-4 h-4" />,
      label: 'Add Tag',
      action: 'add-tag'
    },
    {
      icon: <Copy className="w-4 h-4" />,
      label: 'Copy',
      action: 'copy'
    },
    {
      icon: <Sparkle className="w-4 h-4" />,
      label: 'Magic',
      action: 'magic-action'
    }
  ];

  const primaryActions = actions.filter(a => a.primary);
  const secondaryActions = actions.filter(a => !a.primary);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 10 }}
        transition={{ type: "spring", duration: 0.2 }}
        className="fixed z-50 pointer-events-auto"
        style={{ 
          left: position.x,
          top: position.y - 60,
          transform: 'translateX(-50%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2">
          {/* Primary Actions */}
          <div className="flex items-center gap-1">
            {primaryActions.map((action) => (
              <Button
                key={action.action}
                variant="ghost"
                size="sm"
                onClick={() => onAction(action.action, selectedText)}
                className="h-8 px-2 text-xs font-medium hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                title={action.label}
              >
                {action.icon}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}

            {/* More Actions Toggle */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMore(!showMore)}
                className="h-8 px-2 text-xs font-medium"
                title="More actions"
              >
                •••
              </Button>

              {/* Secondary Actions Dropdown */}
              <AnimatePresence>
                {showMore && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-36"
                  >
                    {secondaryActions.map((action) => (
                      <button
                        key={action.action}
                        onClick={() => {
                          onAction(action.action, selectedText);
                          setShowMore(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Selected Text Preview */}
          <div className="mt-2 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded text-xs text-muted-foreground max-w-64 truncate">
            "{selectedText.slice(0, 50)}{selectedText.length > 50 ? '...' : ''}"
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
