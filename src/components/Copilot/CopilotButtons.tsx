// src/components/Copilot/CopilotButtons.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ListTodo, Hash } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import axios from 'axios'
import toast from 'react-hot-toast'

export const CopilotButtons = ({ context }) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeAction, setActiveAction] = useState(null)
  const [result, setResult] = useState(null)

  const handleAIAction = async (action) => {
    setIsProcessing(true)
    setActiveAction(action)
    
    try {
      const endpoint = {
        summarize: '/api/ai/summarize',
        actions: '/api/ai/suggest-actions',
        tags: '/api/ai/generate-tags'
      }[action]

      const response = await axios.post(
        `http://localhost:8008${endpoint}`,
        { content: context }
      )

      setResult(response.data)
      toast.success(`${action} completed!`)
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
      toast.error(`Failed to ${action}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Floating Copilot Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => handleAIAction('summarize')}
            disabled={isProcessing}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            title="Summarize"
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            onClick={() => handleAIAction('actions')}
            disabled={isProcessing}
            className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
            title="Suggest Actions"
          >
            <ListTodo className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={() => handleAIAction('tags')}
            disabled={isProcessing}
            className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
            title="Generate Tags"
          >
            <Hash className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Result Panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-6 right-24 w-80 bg-card border rounded-lg shadow-xl p-4 z-40"
          >
            <h3 className="font-semibold mb-3 capitalize">{activeAction} Result</h3>
            
            {activeAction === 'summarize' && (
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            )}
            
            {activeAction === 'actions' && (
              <ul className="space-y-2">
                {result.actions?.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            )}
            
            {activeAction === 'tags' && (
              <div className="flex flex-wrap gap-2">
                {result.tags?.map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <Button
              onClick={() => setResult(null)}
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
            >
              Close
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}